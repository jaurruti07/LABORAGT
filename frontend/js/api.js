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
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${CONFIG.API_BASE}${path}`, { ...options, headers });
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
    return this.request('/attendance/check-in', { method: 'POST', body: JSON.stringify(payload) });
  },
  lunchOut(payload) {
    return this.request('/attendance/lunch-out', { method: 'POST', body: JSON.stringify(payload) });
  },
  lunchIn(payload) {
    return this.request('/attendance/lunch-in', { method: 'POST', body: JSON.stringify(payload) });
  },
  checkOut(payload) {
    return this.request('/attendance/check-out', { method: 'POST', body: JSON.stringify(payload) });
  }
};
