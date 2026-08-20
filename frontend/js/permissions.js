/**
 * Módulo de permisos especiales (colaborador + jefe)
 * Motivos: enfermedad, citación juzgado, cita IGSS, otro gubernamental, otro.
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
          <p class="perf-sub">Enfermedad, citación, IGSS y otros · Hora Guatemala</p>
        </div>
        <div class="perf-body" id="perm-content">
          <div class="loader" role="status"><div class="loader-ring"></div>
            <p class="loader-text">Cargando…</p></div>
        </div>
      </div>`;

    try {
      const user = Auth.getUser() || {};
      const isBoss = user.rol === 'jefe' || user.rol === 'administrador' || user.rol === 'admin';
      const [motivosRes, listRes, teamRes] = await Promise.all([
        API.getPermissionMotivos(),
        API.getMyPermissions(),
        isBoss ? API.getTeamPermissions().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      this.renderPermissions(motivosRes.data, listRes.data || [], teamRes.data || [], isBoss);
    } catch (err) {
      if (err.status === 401) { Auth.logout(); return; }
      document.getElementById('perm-content').innerHTML =
        `<div class="error-msg">${err.message}</div>`;
    }
  },

  renderPermissions(motivos, list, teamList, isBoss) {
    const MOTIVO_META = {
      ENFERMEDAD: {
        icon: '🤒',
        hint: 'Incapacidad o malestar temporal',
        tone: 'salud'
      },
      CITACION_JUDICIAL: {
        icon: '⚖️',
        hint: 'Juzgado u órgano judicial',
        tone: 'legal'
      },
      CITACION_GUBERNAMENTAL: {
        icon: '🏛️',
        hint: 'Entidad del Estado',
        tone: 'gov'
      },
      IGSS: {
        icon: '🏥',
        hint: 'Cita médica o trámite IGSS',
        tone: 'salud'
      },
      OTRO: {
        icon: '📋',
        hint: 'Otro motivo justificado',
        tone: 'otro'
      }
    };

    const motivoKeys = Object.keys(motivos || {});
    const catalogHtml = motivoKeys
      .map((k, idx) => {
        const label = motivos[k];
        const meta = MOTIVO_META[k] || { icon: '📌', hint: '', tone: 'otro' };
        const selected = idx === 0 ? ' is-selected' : '';
        return `
          <button type="button" class="motivo-card${selected}" data-motivo="${k}" role="radio"
            aria-checked="${idx === 0 ? 'true' : 'false'}">
            <span class="motivo-icon motivo-tone-${meta.tone}" aria-hidden="true">${meta.icon}</span>
            <span class="motivo-body">
              <span class="motivo-label">${label}</span>
              <span class="motivo-hint">${meta.hint}</span>
            </span>
            <span class="motivo-check" aria-hidden="true">✓</span>
          </button>`;
      })
      .join('');

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
    const firstMotivo = motivoKeys[0] || '';

    const items = list.length
      ? list
          .map((p) => {
            const badge =
              p.estado === 'APROBADO' ? 'ok' : p.estado === 'RECHAZADO' ? 'late' : 'partial';
            const meta = MOTIVO_META[p.motivo] || { icon: '📌' };
            return `
            <div class="tl-item">
              <div class="tl-dot ${badge}"></div>
              <div class="tl-content">
                <div class="tl-top">
                  <span class="tl-date">${meta.icon} ${p.fecha}</span>
                  <span class="tl-badge ${badge}">${p.estado}</span>
                </div>
                <div class="tl-meta">
                  ${p.motivo_label || p.motivo}<br>
                  ${p.hora_inicio} – ${p.hora_fin}
                  · Cubre: ${(p.tipos_cubiertos || []).join(', ') || '—'}
                  ${p.comentario_jefe ? '<br>Jefe: ' + p.comentario_jefe : ''}
                </div>
              </div>
            </div>`;
          })
          .join('')
      : '<p class="empty-hint">Aún no has solicitado permisos.</p>';

    const pending = (teamList || []).filter((p) => p.estado === 'PENDIENTE');
    const teamHtml = isBoss
      ? pending.length
        ? pending
            .map((p) => {
              const col = p.colaborador
                ? `${p.colaborador.nombre} ${p.colaborador.apellidos}`
                : p.nombre_usuario || 'Colaborador';
              const cod = p.colaborador ? p.colaborador.codigo : '';
              const meta = MOTIVO_META[p.motivo] || { icon: '📌' };
              return `
            <div class="tl-item" data-perm-id="${p.id}">
              <div class="tl-dot partial"></div>
              <div class="tl-content">
                <div class="tl-top">
                  <span class="tl-date">${meta.icon} ${col}</span>
                  <span class="tl-badge partial">PENDIENTE</span>
                </div>
                <div class="tl-meta">
                  ${cod ? cod + ' · ' : ''}${p.motivo_label || p.motivo}<br>
                  ${p.fecha} · ${p.hora_inicio} – ${p.hora_fin}<br>
                  Cubre: ${(p.tipos_cubiertos || []).join(', ') || '—'}
                  ${p.descripcion || p.justificacion ? '<br>' + (p.descripcion || p.justificacion) : ''}
                </div>
                <div style="display:flex;gap:8px;margin-top:10px">
                  <button type="button" class="btn btn-primary" style="width:auto;min-height:36px;padding:6px 14px;font-size:13px"
                    data-decide="APROBAR" data-id="${p.id}">Autorizar</button>
                  <button type="button" class="btn btn-secondary" style="width:auto;min-height:36px;padding:6px 14px;font-size:13px"
                    data-decide="RECHAZAR" data-id="${p.id}">Rechazar</button>
                </div>
              </div>
            </div>`;
            })
            .join('')
        : '<p class="empty-hint">No hay solicitudes pendientes del equipo.</p>'
      : '';

    document.getElementById('perm-content').innerHTML = `
      <section class="perf-section">
        <h3 class="perf-section-title">Nueva solicitud</h3>
        <div class="chart-card perm-form-card">
          <form id="perm-form">
            <input type="hidden" id="perm-motivo" value="${firstMotivo}" required />

            <div class="form-group">
              <label class="motivo-catalog-label">Motivo del permiso</label>
              <div class="motivo-catalog" role="radiogroup" aria-label="Catálogo de motivos">
                ${catalogHtml}
              </div>
            </div>

            <div class="form-group">
              <label for="perm-fecha">Fecha del permiso</label>
              <input id="perm-fecha" type="date" required value="${today}" />
            </div>
            <div class="form-group form-row-2">
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
              <label for="perm-desc">Detalle / justificación</label>
              <textarea id="perm-desc" required minlength="5" rows="3"
                placeholder="Ej. Cita IGSS 9:30 a.m. / Citación juzgado civil"></textarea>
            </div>
            <p class="perm-hint">
              Al autorizarse, el sistema registrará permiso especial y no exigirá el marcaje en ese rango (hora Guatemala).
            </p>
            <button type="submit" class="btn btn-primary" id="btn-perm">Enviar solicitud</button>
          </form>
          <div id="perm-msg" class="perm-msg"></div>
        </div>
      </section>

      ${
        isBoss
          ? `<section class="perf-section">
        <h3 class="perf-section-title">Pendientes de mi equipo</h3>
        <div class="timeline">${teamHtml}</div>
      </section>`
          : ''
      }

      <section class="perf-section">
        <h3 class="perf-section-title">Mis solicitudes</h3>
        <div class="timeline">${items}</div>
      </section>`;

    /* Selección de motivo (catálogo) */
    const hiddenMotivo = document.getElementById('perm-motivo');
    document.querySelectorAll('.motivo-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.motivo-card').forEach((c) => {
          c.classList.remove('is-selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('is-selected');
        card.setAttribute('aria-checked', 'true');
        hiddenMotivo.value = card.getAttribute('data-motivo');
      });
    });

    document.getElementById('perm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-perm');
      const msg = document.getElementById('perm-msg');
      if (!hiddenMotivo.value) {
        msg.innerHTML = '<div class="error-msg">Seleccione un motivo del catálogo.</div>';
        return;
      }
      btn.disabled = true;
      btn.classList.add('is-loading');
      try {
        await API.createPermission({
          fecha: document.getElementById('perm-fecha').value,
          hora_inicio: document.getElementById('perm-ini').value,
          hora_fin: document.getElementById('perm-fin').value,
          motivo: hiddenMotivo.value,
          descripcion: document.getElementById('perm-desc').value.trim()
        });
        msg.innerHTML =
          '<p class="mark-status ok">Solicitud enviada. Pendiente de autorización del jefe.</p>';
        this.showPermissions();
      } catch (err) {
        msg.innerHTML = `<div class="error-msg">${err.message}</div>`;
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }
    });

    document.querySelectorAll('[data-decide]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const decision = btn.getAttribute('data-decide');
        let comentario = '';
        if (decision === 'RECHAZAR') {
          comentario = prompt('Motivo del rechazo (opcional):') || '';
        }
        btn.disabled = true;
        btn.classList.add('is-loading');
        try {
          await API.decidePermission(id, decision, comentario);
          this.showPermissions();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
          btn.classList.remove('is-loading');
        }
      });
    });
  }
});
