const API = {
  getToken() { return localStorage.getItem(CONFIG.STORAGE_KEY); },
  setToken(token) { localStorage.setItem(CONFIG.STORAGE_KEY, token); },
  clearAuth() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },
  setUser(user) { localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user)); },
  getUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || 'null'); }
    catch { return null; }
  },
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(CONFIG.API_BASE + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Error de comunicación');
      err.status = res.status;
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
  getDashboard() { return this.request('/admin/dashboard'); },
  getUsers() { return this.request('/admin/users'); },
  getAttendance(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request('/admin/attendance' + (q ? '?' + q : ''));
  },
  getIncidents() { return this.request('/admin/incidents'); },
  getTeamPermissions() { return this.request('/permissions/team'); },
  decidePermission(id, decision, comentario) {
    return this.request('/permissions/' + id + '/decide', {
      method: 'POST',
      body: JSON.stringify({ decision, comentario })
    });
  }
};
