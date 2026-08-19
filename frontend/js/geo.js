/**
 * Geolocalización
 */
const Geo = {
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no disponible en este dispositivo'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision_gps: pos.coords.accuracy
          });
        },
        (err) => {
          let msg = 'No se pudo obtener la ubicación';
          if (err.code === 1) msg = 'Permiso de ubicación denegado';
          if (err.code === 2) msg = 'Ubicación no disponible';
          if (err.code === 3) msg = 'Tiempo de espera agotado al obtener ubicación';
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }
};
