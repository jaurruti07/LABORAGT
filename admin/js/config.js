/**
 * Config panel admin — API por defecto en Render
 */
const CONFIG = {
  API_BASE: (function () {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('api')) {
        localStorage.setItem('laboragt_admin_api', params.get('api'));
        return params.get('api').replace(/\/$/, '') + '/api/v1';
      }
      const stored = localStorage.getItem('laboragt_admin_api');
      if (stored) return stored.replace(/\/$/, '') + '/api/v1';
    } catch (e) {}
    return 'https://laboragt-api.onrender.com/api/v1';
  })(),
  STORAGE_KEY: 'laboragt_admin_token',
  USER_KEY: 'laboragt_admin_user'
};
