/**
 * Cliente API LaboraGT
 */
const API = {
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEY);
  },

  setToken(token) {
    localStorage.setItem(CONFIG.STORAGE_KEY, token);
  },

  clearAuth() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(CONFIG.API_BASE + path, { ...options, headers });
    } catch (networkErr) {
      const err = new Error(
        'No se pudo conectar con el servidor. Si el API estuvo inactivo, espera ~1 min e intenta de nuevo.'
      );
      err.status = 0;
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Error de comunicación');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  login(codigoOrDpi, codigoActivacion) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ codigoOrDpi, codigoActivacion })
    });
  },

  getToday() {
    return this.request('/attendance/today');
  },

  getMe() {
    return this.request('/users/me');
  },

  checkIn(payload) {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  lunchOut(payload) {
    return this.request('/attendance/lunch-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  lunchIn(payload) {
    return this.request('/attendance/lunch-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  checkOut(payload) {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getHistory(from, to) {
    let q = '';
    if (from || to) {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      q = '?' + p.toString();
    }
    return this.request('/attendance/history' + q);
  },

  getStats() {
    return this.request('/attendance/stats');
  },

  getPermissionMotivos() {
    return this.request('/permissions/motivos');
  },

  getMyPermissions() {
    return this.request('/permissions/mine');
  },

  createPermission(body) {
    return this.request('/permissions', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  getTeamPermissions() {
    return this.request('/permissions/team');
  },

  decidePermission(id, decision, comentario) {
    return this.request('/permissions/' + id + '/decide', {
      method: 'POST',
      body: JSON.stringify({ decision, comentario })
    });
  }
};
