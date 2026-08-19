/**
 * Utilidades de geolocalización - Haversine
 */

const EARTH_RADIUS_M = 6371000;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function isWithinRadius(lat, lng, authorizedLat, authorizedLng, radiusMeters) {
  const distance = haversineDistance(lat, lng, authorizedLat, authorizedLng);
  return {
    distance: Math.round(distance * 10) / 10,
    within: distance <= radiusMeters
  };
}

module.exports = { haversineDistance, isWithinRadius };
