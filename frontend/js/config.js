/**
 * Configuración de la PWA LaboraGT
 */
const CONFIG = {
  API_BASE: (function () {
    const DEFAULT = 'https://laboragt-api.onrender.com/api/v1';
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('api') === 'reset') {
        localStorage.removeItem('laboragt_api');
        return DEFAULT;
      }
      if (params.get('api')) {
        const base = params.get('api').replace(/\/$/, '');
        localStorage.setItem('laboragt_api', base);
        return base + '/api/v1';
      }
      const stored = localStorage.getItem('laboragt_api');
      if (stored) {
        const isLocal = /localhost|127\.0\.0\.1/.test(stored);
        const onPages = /github\.io/.test(window.location.hostname);
        if (isLocal && onPages) {
          localStorage.removeItem('laboragt_api');
          return DEFAULT;
        }
        return stored.replace(/\/$/, '') + '/api/v1';
      }
    } catch (e) {}
    return DEFAULT;
  })(),
  STORAGE_KEY: 'laboragt_token',
  USER_KEY: 'laboragt_user'
};
