/**
 * Servicio de marcajes - Motor de reglas (hora America/Guatemala)
 */

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const data = require('../repositories');
const { isWithinRadius } = require('../utils/geo');
const { evaluatePunctuality, nextAllowedType } = require('../utils/schedule');
const { ahoraGT, fechaGT } = require('../utils/time');

function processCheck({
  userId,
  tipo,
  latitud,
  longitud,
  precision_gps,
  fotografia_base64,
  dispositivo,
  client_timestamp
}) {
  try {
    const user = data.findUserById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };
    if (user.estado !== 'activo') return { success: false, error: 'Usuario no activo' };

    const marcajesHoy = data.getTodayAttendance(userId);
    const esperado = nextAllowedType(marcajesHoy);
    if (!esperado) return { success: false, error: 'La jornada de hoy ya está completa' };
    if (tipo !== esperado) {
      return { success: false, error: 'Tipo de marcaje no permitido. Se espera: ' + esperado };
    }

    const gt = ahoraGT();
    const fecha = gt.fecha;
    const hora = gt.hora;
    const fechaHora = gt.fecha_hora;

    const geo = isWithinRadius(
      latitud,
      longitud,
      user.ubicacion.latitud,
      user.ubicacion.longitud,
      user.ubicacion.radio_metros
    );

    let horaProgramada;
    let tolerancia;
    switch (tipo) {
      case 'ENTRADA':
        horaProgramada = user.horario.hora_entrada;
        tolerancia = user.horario.tolerancia_entrada_min;
        break;
      case 'SALIDA_ALMUERZO':
        horaProgramada = user.horario.inicio_almuerzo;
        tolerancia = user.horario.tolerancia_almuerzo_min;
        break;
      case 'REGRESO_ALMUERZO':
        horaProgramada = user.horario.fin_almuerzo;
        tolerancia = user.horario.tolerancia_almuerzo_min;
        break;
      case 'SALIDA':
        horaProgramada = user.horario.hora_salida;
        tolerancia = user.horario.tolerancia_salida_min;
        break;
      default:
        horaProgramada = null;
        tolerancia = 0;
    }

    const puntualidad = evaluatePunctuality(hora, horaProgramada, tolerancia, tipo);
    let estado = 'VALIDO';
    const incidencias = [];

    if (puntualidad.cumplimiento === 'TARDIO') {
      estado = 'TARDIO';
      incidencias.push({
        tipo: 'ENTRADA_TARDIA',
        minutos: puntualidad.minutosDiferencia,
        descripcion: puntualidad.mensaje
      });
    } else if (puntualidad.cumplimiento === 'ANTICIPADO') {
      estado = 'SALIDA_ANTICIPADA';
      incidencias.push({
        tipo: 'SALIDA_ANTICIPADA',
        minutos: puntualidad.minutosDiferencia,
        descripcion: puntualidad.mensaje
      });
    }

    if (!geo.within) {
      if (estado === 'VALIDO') estado = 'FUERA_DE_UBICACION';
      else if (estado === 'TARDIO') estado = 'TARDIO_Y_FUERA_DE_UBICACION';
      incidencias.push({
        tipo: 'FUERA_DE_UBICACION',
        metros: geo.distance,
        descripcion:
          'Ubicación a ' +
          geo.distance +
          ' m del punto autorizado (radio: ' +
          user.ubicacion.radio_metros +
          ' m)'
      });
    }

    const marcaje = {
      id: uuidv4(),
      usuario_id: userId,
      nombre_usuario: user.nombre + ' ' + user.apellidos,
      fecha,
      hora,
      fecha_hora: fechaHora,
      timezone: gt.timezone,
      tipo,
      latitud,
      longitud,
      precision_gps: precision_gps || null,
      distancia_metros: geo.distance,
      dentro_ubicacion: geo.within,
      cumplimiento_horario: puntualidad.cumplimiento,
      minutos_diferencia: puntualidad.minutosDiferencia,
      estado,
      dispositivo: dispositivo || {},
      fotografia_presente: !!fotografia_base64,
      transaction_id: 'TXN-' + Date.now(),
      sincronizado_posteriormente: false,
      created_at: fechaHora,
      incidencias
    };

    data.addAttendance(marcaje);

    const mensajesTipo = {
      ENTRADA: 'Entrada',
      SALIDA_ALMUERZO: 'Salida a almuerzo',
      REGRESO_ALMUERZO: 'Regreso de almuerzo',
      SALIDA: 'Salida'
    };

    let mensaje = mensajesTipo[tipo] + ' registrada';
    if (estado === 'VALIDO') mensaje = '¡' + mensajesTipo[tipo] + ' registrada correctamente!';
    else if (estado === 'TARDIO' || estado === 'TARDIO_Y_FUERA_DE_UBICACION')
      mensaje = mensajesTipo[tipo] + ' registrada con observación';
    else if (estado === 'FUERA_DE_UBICACION')
      mensaje = mensajesTipo[tipo] + ' registrada (fuera de ubicación)';

    return {
      success: true,
      marcaje: {
        id: marcaje.id,
        tipo: marcaje.tipo,
        fecha_hora: marcaje.fecha_hora,
        hora: marcaje.hora,
        timezone: gt.timezone,
        estado: marcaje.estado,
        cumplimiento_horario: marcaje.cumplimiento_horario,
        cumplimiento_geografico: geo.within ? 'DENTRO' : 'FUERA',
        distancia_metros: geo.distance,
        minutos_diferencia: marcaje.minutos_diferencia,
        mensaje,
        detalle: incidencias.map((i) => i.descripcion).join(' · ') || 'Sin observaciones',
        incidencias
      }
    };
  } catch (err) {
    console.error('[attendanceService.processCheck]', err.message);
    return { success: false, error: 'Error interno al procesar el marcaje' };
  }
}

function getTodaySummary(userId) {
  try {
    const user = data.findUserById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };
    const marcajes = data.getTodayAttendance(userId);
    const siguiente = nextAllowedType(marcajes);
    const gt = ahoraGT();
    return {
      success: true,
      data: {
        usuario: {
          nombre: user.nombre,
          apellidos: user.apellidos,
          codigo: user.codigo_empleado
        },
        horario: user.horario,
        ubicacion: {
          nombre: user.ubicacion.nombre,
          radio_metros: user.ubicacion.radio_metros
        },
        marcajes: marcajes.map((m) => ({
          tipo: m.tipo,
          hora: m.hora,
          estado: m.estado
        })),
        siguiente_marcaje: siguiente,
        jornada_completa: !siguiente,
        timezone: gt.timezone,
        fecha_guatemala: gt.fecha,
        hora_guatemala: gt.hora
      }
    };
  } catch (err) {
    console.error('[attendanceService.getTodaySummary]', err.message);
    return { success: false, error: 'Error al obtener jornada de hoy' };
  }
}

function getHistory(userId, from, to) {
  try {
    const list = data.getAttendanceHistory(userId, from, to);
    const byDate = {};
    for (const m of list) {
      if (!byDate[m.fecha]) byDate[m.fecha] = [];
      byDate[m.fecha].push(m);
    }
    const dias = Object.keys(byDate)
      .sort((a, b) => b.localeCompare(a))
      .map((fecha) => {
        const marcajes = byDate[fecha].sort((a, b) => a.hora.localeCompare(b.hora));
        const entrada = marcajes.find((x) => x.tipo === 'ENTRADA');
        return {
          fecha,
          marcajes: marcajes.map((m) => ({
            id: m.id,
            tipo: m.tipo,
            hora: m.hora,
            estado: m.estado,
            cumplimiento_horario: m.cumplimiento_horario,
            minutos_diferencia: m.minutos_diferencia || 0,
            dentro_ubicacion: m.dentro_ubicacion,
            distancia_metros: m.distancia_metros
          })),
          entrada_estado: entrada ? entrada.estado : null,
          tarde: entrada ? entrada.cumplimiento_horario === 'TARDIO' : false,
          minutos_tardanza:
            entrada && entrada.cumplimiento_horario === 'TARDIO'
              ? entrada.minutos_diferencia || 0
              : 0,
          jornada_completa: marcajes.some(
            (m) => m.tipo === 'SALIDA' || m.estado === 'PERMISO_ESPECIAL'
          )
        };
      });
    return { success: true, data: { dias, total_registros: list.length } };
  } catch (err) {
    console.error('[attendanceService.getHistory]', err.message);
    return { success: false, error: 'Error al obtener historial' };
  }
}

function getPerformanceStats(userId) {
  try {
    const today = fechaGT();
    const from = today.slice(0, 8) + '01';
    const to = today;
    const list = data.getAttendanceHistory(userId, from, to);
    const byDate = {};
    for (const m of list) {
      if (!byDate[m.fecha]) byDate[m.fecha] = [];
      byDate[m.fecha].push(m);
    }
    const fechas = Object.keys(byDate).sort();
    let diasLaborados = 0;
    let entradasTarde = 0;
    let minutosTardanza = 0;
    let salidasAnticipadas = 0;
    let jornadasCompletas = 0;
    let puntuales = 0;

    for (const fecha of fechas) {
      const ms = byDate[fecha];
      const entrada = ms.find((m) => m.tipo === 'ENTRADA');
      if (!entrada) continue;
      diasLaborados += 1;
      if (entrada.cumplimiento_horario === 'TARDIO') {
        entradasTarde += 1;
        minutosTardanza += entrada.minutos_diferencia || 0;
      } else if (
        entrada.cumplimiento_horario === 'PUNTUAL' ||
        entrada.estado === 'PERMISO_ESPECIAL'
      ) {
        puntuales += 1;
      }
      const salida = ms.find((m) => m.tipo === 'SALIDA');
      if (salida) {
        jornadasCompletas += 1;
        if (salida.cumplimiento_horario === 'ANTICIPADO') salidasAnticipadas += 1;
      }
    }

    const puntualidadPct =
      diasLaborados > 0 ? Math.round((puntuales / diasLaborados) * 100) : 100;

    const timeline = fechas
      .slice()
      .reverse()
      .slice(0, 12)
      .map((fecha) => {
        const ms = byDate[fecha].sort((a, b) => a.hora.localeCompare(b.hora));
        const entrada = ms.find((m) => m.tipo === 'ENTRADA');
        return {
          fecha,
          entrada_hora: entrada ? entrada.hora.slice(0, 5) : null,
          estado: entrada ? entrada.estado : null,
          minutos_tardanza:
            entrada && entrada.cumplimiento_horario === 'TARDIO'
              ? entrada.minutos_diferencia || 0
              : 0,
          marcajes_count: ms.length,
          completa: ms.some((m) => m.tipo === 'SALIDA')
        };
      });

    const [y, mo] = today.split('-').map(Number);
    return {
      success: true,
      data: {
        periodo: { from, to, mes: mo, anio: y },
        kpis: {
          dias_laborados: diasLaborados,
          puntualidad_pct: puntualidadPct,
          entradas_tarde: entradasTarde,
          minutos_tardanza_mes: minutosTardanza,
          horas_tardanza: Math.round((minutosTardanza / 60) * 10) / 10,
          salidas_anticipadas: salidasAnticipadas,
          jornadas_completas: jornadasCompletas,
          promedio_tardanza_min:
            entradasTarde > 0 ? Math.round(minutosTardanza / entradasTarde) : 0
        },
        timeline
      }
    };
  } catch (err) {
    console.error('[attendanceService.getPerformanceStats]', err.message);
    return { success: false, error: 'Error al calcular métricas' };
  }
}

module.exports = { processCheck, getTodaySummary, getHistory, getPerformanceStats };
