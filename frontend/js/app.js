/**
 * LaboraGT PWA - Aplicación principal
 */

const App = {
  root: null,

  init() {
    this.root = document.getElementById('app');
    if (Auth.isLoggedIn()) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  },

  showLogin(errorMsg = '') {
    this.root.innerHTML = `
      <div class="screen login-screen">
        <div class="login-hero">
          <div class="login-visual" aria-hidden="true">
            <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="40" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
              <circle cx="44" cy="44" r="32" fill="rgba(255,255,255,0.12)"/>
              <path d="M44 22v22l14 8" stroke="#5EEAD4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="44" cy="44" r="4" fill="#fff"/>
              <path d="M28 62c4-6 10-9 16-9s12 3 16 9" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="login-brand">Labora<span>GT</span></div>
          <p class="login-tagline">Tu jornada, registrada con evidencia verificable.</p>
          <div class="login-pills">
            <span class="login-pill">📍 Ubicación</span>
            <span class="login-pill">📷 Foto</span>
            <span class="login-pill">⏱ Horario</span>
          </div>
        </div>
        <div class="login-form-panel">
          <h2>Iniciar sesión</h2>
          <p class="sub">Ingresa tu código institucional para continuar</p>
          ${errorMsg ? `<div class="error-msg">${errorMsg}</div>` : ''}
          <form id="login-form">
            <div class="form-group">
              <label for="codigo">Código de empleado o DPI</label>
              <input id="codigo" name="codigo" type="text" required autocomplete="username"
                     placeholder="Ej. EMP-001" inputmode="text" />
            </div>
            <div class="form-group">
              <label for="activacion">Código de activación</label>
              <input id="activacion" name="activacion" type="text" required
                     placeholder="Código que te asignó RR.HH." autocomplete="one-time-code" />
            </div>
            <button type="submit" class="btn btn-primary" id="btn-login">Entrar a mi jornada</button>
          </form>
          <p class="login-demo">Demo · <code>EMP-001</code> / <code>ACT-2026</code></p>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const codigo = document.getElementById('codigo').value.trim();
      const activacion = document.getElementById('activacion').value.trim();
      const btn = document.getElementById('btn-login');
      btn.disabled = true;
      btn.textContent = 'Verificando…';

      try {
        const res = await API.login(codigo, activacion);
        API.setToken(res.token);
        Auth.setUser(res.user);
        this.showDashboard();
      } catch (err) {
        this.showLogin(err.message || 'Error de autenticación');
      }
    });
  },

  async showDashboard() {
    this.root.innerHTML = `
      <div class="screen screen-enter">
        <div class="screen-header">
          <h1>LaboraGT</h1>
          <button class="btn btn-secondary" style="width:auto;min-height:36px;padding:8px 12px;font-size:13px"
                  onclick="Auth.logout()">Salir</button>
        </div>
        <div id="dashboard-content">
          <p style="color:var(--color-text-secondary)">Cargando…</p>
        </div>
      </div>
    `;

    try {
      const res = await API.getToday();
      this.renderDashboard(res.data);
    } catch (err) {
      if (err.status === 401) {
        Auth.logout();
        return;
      }
      document.getElementById('dashboard-content').innerHTML =
        `<div class="error-msg">${err.message}</div>`;
    }
  },

  renderDashboard(data) {
    const user = data.usuario;
    const horario = data.horario;
    const marcajes = data.marcajes || [];
    const siguiente = data.siguiente_marcaje;

    const saludo = this.getGreeting();
    const fecha = new Date().toLocaleDateString('es-GT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const tiposLabel = {
      ENTRADA: 'Entrada',
      SALIDA_ALMUERZO: 'Salida a almuerzo',
      REGRESO_ALMUERZO: 'Regreso de almuerzo',
      SALIDA: 'Salida'
    };

    const pasos = ['ENTRADA', 'SALIDA_ALMUERZO', 'REGRESO_ALMUERZO', 'SALIDA'];
    const hechos = marcajes.map(m => m.tipo);

    let progressHtml = pasos.map((t, i) => {
      const hecho = hechos.includes(t);
      const actual = t === siguiente;
      let cls = 'progress-step';
      if (hecho) cls += ' done';
      if (actual) cls += ' current';
      const labels = ['Ent.', 'Alm.', 'Reg.', 'Sal.'];
      return `<div class="${cls}">${labels[i]}</div>`;
    }).join('');

    let listaHtml = pasos.map(t => {
      const m = marcajes.find(x => x.tipo === t);
      if (m) {
        return `<li><span>✓ ${tiposLabel[t]}</span><span class="hora">${m.hora.slice(0,5)}</span></li>`;
      }
      return `<li><span style="color:var(--color-text-muted)">— ${tiposLabel[t]}</span><span class="hora">pendiente</span></li>`;
    }).join('');

    const btnLabel = siguiente ? `MARCAR ${tiposLabel[siguiente].toUpperCase()}` : 'Jornada finalizada';

    document.getElementById('dashboard-content').innerHTML = `
      <p class="greeting anim-fade-up">${saludo}, ${user.nombre}</p>
      <p class="date-label anim-fade-up anim-delay-1">${fecha}</p>

      <div class="section">
        <div class="card card-accent-success card-enter anim-delay-1">
          <div class="section-title">Estado de mi jornada</div>
          <div style="font-size:18px;font-weight:600">
            ${data.jornada_completa ? '🟢 Jornada completada' : '🟢 Jornada en curso'}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card card-enter anim-delay-2">
          <div class="section-title">Horario de hoy</div>
          <div style="font-size:18px;font-weight:600">${horario.hora_entrada} — ${horario.hora_salida}</div>
          <div style="font-size:14px;color:var(--color-text-secondary);margin-top:4px">
            Almuerzo: ${horario.inicio_almuerzo} – ${horario.fin_almuerzo}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="card card-enter anim-delay-3">
          <div class="section-title">Progreso de marcajes</div>
          <div class="progress-steps">${progressHtml}</div>
          <ul class="marcaje-list">${listaHtml}</ul>
        </div>
      </div>

      <div class="section">
        <div class="card card-enter anim-delay-4">
          <div class="section-title">Ubicación</div>
          <div>✓ Validación al momento del marcaje</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-top:4px">
            Radio autorizado: ${data.ubicacion.radio_metros} m
          </div>
        </div>
      </div>

      <div class="mark-action anim-fade-up anim-delay-5">
        ${siguiente ? `
          <button class="btn btn-primary btn-mark-pulse" id="btn-marcar">
            ${btnLabel}
          </button>
        ` : `
          <button class="btn btn-primary" disabled>Jornada finalizada</button>
        `}
        <div class="nav-secondary">
          <button class="btn btn-secondary" disabled>Historial</button>
          <button class="btn btn-secondary" disabled>Permisos</button>
        </div>
      </div>
    `;

    if (siguiente) {
      document.getElementById('btn-marcar').addEventListener('click', () => {
        this.startMarkingFlow(siguiente);
      });
    }
  },

  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  },

  async startMarkingFlow(tipo) {
    const labels = {
      ENTRADA: 'Entrada',
      SALIDA_ALMUERZO: 'Salida a almuerzo',
      REGRESO_ALMUERZO: 'Regreso de almuerzo',
      SALIDA: 'Salida'
    };

    this.root.innerHTML = `
      <div class="screen screen-enter">
        <div class="screen-header">
          <button onclick="App.showDashboard()" style="font-size:18px">←</button>
          <h1>Confirmar marcaje</h1>
          <span></span>
        </div>
        <p style="margin-bottom:16px">Vas a registrar: <strong>${labels[tipo]}</strong></p>
        <div class="card card-enter">
          <ul class="checklist" id="checklist">
            <li><span class="icon pending" id="c-bio">1</span> Identidad</li>
            <li><span class="icon pending" id="c-cam">2</span> Cámara / Foto</li>
            <li><span class="icon pending" id="c-geo">3</span> Ubicación GPS</li>
            <li><span class="icon pending" id="c-val">4</span> Validaciones</li>
          </ul>
        </div>
        <div id="flow-status" style="margin-top:16px;font-size:14px;color:var(--color-text-secondary)"></div>
        <div class="mark-action">
          <button class="btn btn-primary" id="btn-confirm" disabled>Confirmar y registrar</button>
        </div>
      </div>
    `;

    const setStep = (id, state) => {
      const el = document.getElementById(id);
      el.className = 'icon ' + state;
      if (state === 'done') el.textContent = '✓';
      if (state === 'loading') el.textContent = '…';
    };

    const status = document.getElementById('flow-status');
    let fotoBase64 = null;
    let geoData = null;

    try {
      setStep('c-bio', 'loading');
      status.textContent = 'Verificando sesión…';
      await new Promise(r => setTimeout(r, 400));
      setStep('c-bio', 'done');

      setStep('c-cam', 'loading');
      status.textContent = 'Abriendo cámara…';
      try {
        fotoBase64 = await Camera.capture();
        setStep('c-cam', 'done');
      } catch (e) {
        status.textContent = 'Foto omitida (demo). Continuando…';
        setStep('c-cam', 'done');
      }

      setStep('c-geo', 'loading');
      status.textContent = 'Obteniendo ubicación…';
      geoData = await Geo.getCurrentPosition();
      setStep('c-geo', 'done');
      status.textContent = `Ubicación: ±${Math.round(geoData.precision_gps)} m`;

      setStep('c-val', 'done');
      status.textContent = 'Listo para registrar';
      const btn = document.getElementById('btn-confirm');
      btn.disabled = false;

      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = 'Registrando…';
        setStep('c-val', 'loading');

        const payload = {
          latitud: geoData.latitud,
          longitud: geoData.longitud,
          precision_gps: geoData.precision_gps,
          fotografia_base64: fotoBase64,
          dispositivo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          },
          client_timestamp: new Date().toISOString()
        };

        const endpoints = {
          ENTRADA: () => API.checkIn(payload),
          SALIDA_ALMUERZO: () => API.lunchOut(payload),
          REGRESO_ALMUERZO: () => API.lunchIn(payload),
          SALIDA: () => API.checkOut(payload)
        };

        try {
          const result = await endpoints[tipo]();
          this.showResult(result);
        } catch (err) {
          this.showResult({ success: false, error: err.message });
        }
      };
    } catch (err) {
      status.innerHTML = `<div class="error-msg">${err.message}</div>`;
      document.getElementById('btn-confirm').textContent = 'Reintentar';
      document.getElementById('btn-confirm').disabled = false;
      document.getElementById('btn-confirm').onclick = () => this.startMarkingFlow(tipo);
    }
  },

  showResult(result) {
    if (!result.success) {
      this.root.innerHTML = `
        <div class="screen result-screen screen-enter">
          <div class="result-icon">✕</div>
          <div class="result-title">No se pudo registrar</div>
          <p>${result.error || 'Error desconocido'}</p>
          <button class="btn btn-primary" onclick="App.showDashboard()">Volver</button>
        </div>
      `;
      return;
    }

    const m = result.marcaje;
    const isOk = m.estado === 'VALIDO';

    this.root.innerHTML = `
      <div class="screen result-screen screen-enter">
        <div class="result-icon">${isOk ? '✓' : '⚠'}</div>
        <div class="result-title">${m.mensaje}</div>
        <div class="result-time">${m.hora}</div>
        <div class="card result-details ${isOk ? 'card-accent-success' : 'card-accent-warning'}">
          <div><strong>Estado:</strong> ${m.estado}</div>
          <div style="margin-top:8px">${m.detalle || ''}</div>
          <div style="margin-top:8px;font-size:13px;color:var(--color-text-secondary)">
            Distancia: ${m.distancia_metros} m · Geo: ${m.cumplimiento_geografico}
          </div>
        </div>
        <button class="btn btn-primary" onclick="App.showDashboard()">Volver al inicio</button>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
