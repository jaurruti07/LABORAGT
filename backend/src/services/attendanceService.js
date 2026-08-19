/**
 * Servicio de marcajes - Motor de reglas
 * Principio: registra hechos; las reglas los interpretan; los permisos justifican.
 */

const { v4: uuidv4 } = require('uuid');
const mock = require('../repositories/mockData');
const { isWithinRadius } = require('../utils/geo');
const { evaluatePunctuality, nextAllowedType } = require('../utils/schedule');

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
    const user = mock.findUserById(userId);
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (user.estado !== 'activo') {
      return { success: false, error: 'Usuario no activo' };
    }

    const marcajesHoy = mock.getTodayAttendance(userId);
    const esperado = nextAllowedType(marcajesHoy);

    if (!esperado) {
      return { success: false, error: 'La jornada de hoy ya está completa' };
    }

    if (tipo !== esperado) {
      return {
        success: false,
        error: 'Tipo de marcaje no permitido. Se espera: ' + esperado
      };
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 8);
    const fechaHora = ahora.toISOString();

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
        descripcion: 'Ubicación a ' + geo.distance + ' m del punto autorizado (radio: ' + user.ubicacion.radio_metros + ' m)'
      });
    }

    const marcaje = {
      id: uuidv4(),
      usuario_id: userId,
      nombre_usuario: user.nombre + ' ' + user.apellidos,
      fecha,
      hora,
      fecha_hora: fechaHora,
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

    mock.addAttendance(marcaje);

    const mensajesTipo = {
      ENTRADA: 'Entrada',
      SALIDA_ALMUERZO: 'Salida a almuerzo',
      REGRESO_ALMUERZO: 'Regreso de almuerzo',
      SALIDA: 'Salida'
    };

    let mensaje = mensajesTipo[tipo] + ' registrada';
    if (estado === 'VALIDO') {
      mensaje = '¡' + mensajesTipo[tipo] + ' registrada correctamente!';
    } else if (estado === 'TARDIO' || estado === 'TARDIO_Y_FUERA_DE_UBICACION') {
      mensaje = mensajesTipo[tipo] + ' registrada con observación';
    } else if (estado === 'FUERA_DE_UBICACION') {
      mensaje = mensajesTipo[tipo] + ' registrada (fuera de ubicación)';
    }

    return {
      success: true,
      marcaje: {
        id: marcaje.id,
        tipo: marcaje.tipo,
        fecha_hora: marcaje.fecha_hora,
        hora: marcaje.hora,
        estado: marcaje.estado,
        cumplimiento_horario: marcaje.cumplimiento_horario,
        cumplimiento_geografico: geo.within ? 'DENTRO' : 'FUERA',
        distancia_metros: geo.distance,
        minutos_diferencia: marcaje.minutos_diferencia,
        mensaje,
        detalle: incidencias.map(i => i.descripcion).join(' · ') || 'Sin observaciones',
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
    const user = mock.findUserById(userId);
    if (!user) return null;

    const marcajes = mock.getTodayAttendance(userId);
    const siguiente = nextAllowedType(marcajes);

    return {
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
      marcajes: marcajes.map(m => ({
        tipo: m.tipo,
        hora: m.hora,
        estado: m.estado
      })),
      siguiente_marcaje: siguiente,
      jornada_completa: !siguiente
    };
  } catch (err) {
    console.error('[attendanceService.getTodaySummary]', err.message);
    return null;
  }
}

module.exports = { processCheck, getTodaySummary };
