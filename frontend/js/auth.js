/**
 * Gestión de sesión
 */
const Auth = {
  isLoggedIn() {
    return !!API.getToken();
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || 'null');
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },

  logout() {
    API.clearAuth();
    App.showLogin();
  }
};
