/**
 * Utilidades de evaluación de horario
 */

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

function evaluatePunctuality(marcajeTime, scheduledTime, toleranciaMin = 10, tipo = 'ENTRADA') {
  const marcajeMin = timeToMinutes(marcajeTime);
  const scheduledMin = timeToMinutes(scheduledTime);
  if (marcajeMin === null || scheduledMin === null) {
    return { cumplimiento: 'DESCONOCIDO', minutosDiferencia: 0, mensaje: 'Horario no disponible' };
  }
  const diff = marcajeMin - scheduledMin;
  if (tipo === 'ENTRADA' || tipo === 'REGRESO_ALMUERZO') {
    if (diff <= toleranciaMin) {
      return { cumplimiento: 'PUNTUAL', minutosDiferencia: Math.max(0, diff), mensaje: 'Dentro del horario permitido' };
    }
    return { cumplimiento: 'TARDIO', minutosDiferencia: diff, mensaje: `Tardanza de ${diff} minutos (tolerancia: ${toleranciaMin} min)` };
  }
  if (diff >= -toleranciaMin) {
    return { cumplimiento: 'PUNTUAL', minutosDiferencia: Math.abs(Math.min(0, diff)), mensaje: 'Dentro del horario permitido' };
  }
  return { cumplimiento: 'ANTICIPADO', minutosDiferencia: Math.abs(diff), mensaje: `Salida anticipada de ${Math.abs(diff)} minutos` };
}

function nextAllowedType(marcajesHoy = []) {
  const tipos = marcajesHoy.map(m => m.tipo);
  if (!tipos.includes('ENTRADA')) return 'ENTRADA';
  if (!tipos.includes('SALIDA_ALMUERZO')) return 'SALIDA_ALMUERZO';
  if (!tipos.includes('REGRESO_ALMUERZO')) return 'REGRESO_ALMUERZO';
  if (!tipos.includes('SALIDA')) return 'SALIDA';
  return null;
}

module.exports = { timeToMinutes, evaluatePunctuality, nextAllowedType };
