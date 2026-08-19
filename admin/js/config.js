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
    return 'http://localhost:3000/api/v1';
  })(),
  STORAGE_KEY: 'laboragt_admin_token',
  USER_KEY: 'laboragt_admin_user'
};
