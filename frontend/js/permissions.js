/**
 * Módulo de permisos especiales (colaborador)
 */
Object.assign(App, {
  async showPermissions() {
    this.root.innerHTML = `
      <div class="perf-screen screen-enter">
        <div class="perf-header">
          <div class="perf-nav">
            <button type="button" onclick="App.showDashboard()" aria-label="Volver">←</button>
            <span class="title">Permisos especiales</span>
          </div>
          <p class="perf-sub">Enfermedad, citación, IGSS y otros</p>
        </div>
        <div class="perf-body" id="perm-content">
          <div class="loader" role="status"><div class="loader-ring"></div>
            <p class="loader-text">Cargando…</p></div>
        </div>
      </div>`;

    try {
      const [motivosRes, listRes] = await Promise.all([
        API.getPermissionMotivos(),
        API.getMyPermissions()
      ]);
      this.renderPermissions(motivosRes.data, listRes.data || []);
    } catch (err) {
      if (err.status === 401) { Auth.logout(); return; }
      document.getElementById('perm-content').innerHTML =
        `<div class="error-msg">${err.message}</div>`;
    }
  },

  renderPermissions(motivos, list) {
    const motivoOpts = Object.entries(motivos || {})
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join('');

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });

    const items = list.length
      ? list.map((p) => {
          const badge =
            p.estado === 'APROBADO'
              ? 'ok'
              : p.estado === 'RECHAZADO'
              ? 'late'
              : 'partial';
          return `
            <div class="tl-item">
              <div class="tl-dot ${badge}"></div>
              <div class="tl-content">
                <div class="tl-top">
                  <span class="tl-date">${p.fecha}</span>
                  <span class="tl-badge ${badge}">${p.estado}</span>
                </div>
                <div class="tl-meta">
                  ${p.motivo_label}<br>
                  ${p.hora_inicio} – ${p.hora_fin}
                  · Cubre: ${(p.tipos_cubiertos || []).join(', ') || '—'}
                  ${p.comentario_jefe ? '<br>Jefe: ' + p.comentario_jefe : ''}
                </div>
              </div>
            </div>`;
        }).join('')
      : '<p class="empty-hint">Aún no has solicitado permisos.</p>';

    document.getElementById('perm-content').innerHTML = `
      <section class="perf-section">
        <h3 class="perf-section-title">Nueva solicitud</h3>
        <div class="chart-card" style="padding:16px">
          <form id="perm-form">
            <div class="form-group">
              <label for="perm-fecha">Fecha del permiso</label>
              <input id="perm-fecha" type="date" required value="${today}" />
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label for="perm-ini">Hora inicio</label>
                <input id="perm-ini" type="time" required value="08:00" />
              </div>
              <div>
                <label for="perm-fin">Hora fin</label>
                <input id="perm-fin" type="time" required value="12:00" />
              </div>
            </div>
            <div class="form-group">
              <label for="perm-motivo">Motivo</label>
              <select id="perm-motivo" required>${motivoOpts}</select>
            </div>
            <div class="form-group">
              <label for="perm-desc">Detalle (opcional)</label>
              <input id="perm-desc" type="text" placeholder="Ej. Cita IGSS 9:30 a.m." />
            </div>
            <p style="font-size:12px;color:var(--color-text-muted);margin-bottom:12px">
              Al autorizarse, el sistema registrará permiso especial y no exigirá el marcaje en ese rango.
            </p>
            <button type="submit" class="btn btn-primary" id="btn-perm">Enviar solicitud</button>
          </form>
          <div id="perm-msg" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="perf-section">
        <h3 class="perf-section-title">Mis solicitudes</h3>
        <div class="timeline">${items}</div>
      </section>`;

    document.getElementById('perm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-perm');
      const msg = document.getElementById('perm-msg');
      btn.disabled = true;
      btn.classList.add('is-loading');
      try {
        await API.createPermission({
          fecha: document.getElementById('perm-fecha').value,
          hora_inicio: document.getElementById('perm-ini').value,
          hora_fin: document.getElementById('perm-fin').value,
          motivo: document.getElementById('perm-motivo').value,
          descripcion: document.getElementById('perm-desc').value.trim()
        });
        msg.innerHTML = '<p class="mark-status ok">Solicitud enviada. Pendiente de autorización del jefe.</p>';
        this.showPermissions();
      } catch (err) {
        msg.innerHTML = `<div class="error-msg">${err.message}</div>`;
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }
    });
  }
});
