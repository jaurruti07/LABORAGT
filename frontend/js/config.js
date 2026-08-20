/**
 * Configuración de la PWA LaboraGT
 * API por defecto: Render production
 * Override: ?api=https://otro-host.com
 */
const CONFIG = {
  API_BASE: (function () {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('api')) {
        localStorage.setItem('laboragt_api', params.get('api'));
        return params.get('api').replace(/\/$/, '') + '/api/v1';
      }
      const stored = localStorage.getItem('laboragt_api');
      if (stored) return stored.replace(/\/$/, '') + '/api/v1';
    } catch (e) {}
    return 'https://laboragt-api.onrender.com/api/v1';
  })(),
  STORAGE_KEY: 'laboragt_token',
  USER_KEY: 'laboragt_user'
};
