/**
 * Zona horaria institucional: America/Guatemala (UTC-6, sin horario de verano)
 */

const TZ = 'America/Guatemala';

function getParts(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = {};
  for (const { type, value } of dtf.formatToParts(date)) {
    if (type !== 'literal') parts[type] = value;
  }
  // hour12:false puede devolver 24 en algunos entornos → normalizar
  if (parts.hour === '24') parts.hour = '00';
  return parts;
}

function fechaGT(date = new Date()) {
  const p = getParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function horaGT(date = new Date()) {
  const p = getParts(date);
  return `${p.hour}:${p.minute}:${p.second}`;
}

function ahoraGT() {
  return {
    fecha: fechaGT(),
    hora: horaGT(),
    fecha_hora: `${fechaGT()}T${horaGT()}-06:00`,
    timezone: TZ
  };
}

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

/**
 * Dado un rango de horas y el horario del colaborador, determina qué tipos de marcaje cubre.
 */
function tiposCubiertosPorRango(horaInicio, horaFin, horario) {
  const ini = timeToMinutes(horaInicio);
  const fin = timeToMinutes(horaFin);
  if (ini == null || fin == null) return [];
  const covered = [];
  const checks = [
    { tipo: 'ENTRADA', t: timeToMinutes(horario.hora_entrada) },
    { tipo: 'SALIDA_ALMUERZO', t: timeToMinutes(horario.inicio_almuerzo) },
    { tipo: 'REGRESO_ALMUERZO', t: timeToMinutes(horario.fin_almuerzo) },
    { tipo: 'SALIDA', t: timeToMinutes(horario.hora_salida) }
  ];
  for (const c of checks) {
    if (c.t != null && c.t >= ini && c.t <= fin) covered.push(c.tipo);
  }
  // Si el rango es amplio (jornada completa), cubrir todos
  if (fin - ini >= 6 * 60 && covered.length === 0) {
    return ['ENTRADA', 'SALIDA_ALMUERZO', 'REGRESO_ALMUERZO', 'SALIDA'];
  }
  return covered;
}

module.exports = {
  TZ,
  fechaGT,
  horaGT,
  ahoraGT,
  timeToMinutes,
  tiposCubiertosPorRango
};
