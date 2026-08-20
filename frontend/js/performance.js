/**
 * Dashboard de rendimiento del colaborador
 */
Object.assign(App, {
  async showPerformance() {
    this.root.innerHTML = `
      <div class="perf-screen screen-enter">
        <div class="perf-header">
          <div class="perf-nav">
            <button type="button" onclick="App.showDashboard()" aria-label="Volver">←</button>
            <span class="title">Mi rendimiento</span>
          </div>
          <p class="perf-sub">Indicadores de tu jornada este mes</p>
        </div>
        <div class="perf-body" id="perf-content">
          <p style="color:var(--color-text-secondary);text-align:center;padding:24px">Cargando métricas…</p>
        </div>
      </div>`;

    try {
      const [statsRes, histRes] = await Promise.all([API.getStats(), API.getHistory()]);
      this.renderPerformance(statsRes.data, histRes.data);
    } catch (err) {
      if (err.status === 401) { Auth.logout(); return; }
      document.getElementById('perf-content').innerHTML =
        `<div class="error-msg">${err.message}</div>`;
    }
  },

  buildTardinessBarChart(timeline) {
    const days = (timeline || []).slice().reverse();
    if (!days.length) {
      return '<p class="empty-hint">Sin datos para el gráfico.</p>';
    }

    const values = days.map((d) => d.minutos_tardanza || 0);
    const maxVal = Math.max(15, ...values);
    const W = 320;
    const H = 160;
    const padL = 28;
    const padR = 8;
    const padT = 16;
    const padB = 36;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const n = days.length;
    const gap = 4;
    const barW = Math.max(6, (chartW - gap * (n - 1)) / n);

    const bars = days.map((day, i) => {
      const v = day.minutos_tardanza || 0;
      const h = v <= 0 ? 4 : Math.max(6, (v / maxVal) * chartH);
      const x = padL + i * (barW + gap);
      const y = padT + chartH - h;
      const color = v > 0 ? '#D97706' : '#0D9488';
      const d = new Date(day.fecha + 'T12:00:00');
      const label = String(d.getDate());
      const title = day.fecha + (v > 0 ? ' · +' + v + ' min' : ' · puntual');
      return `
        <g class="bar-group">
          <title>${title}</title>
          <rect class="bar" x="${x}" y="${y}" width="${barW}" height="${h}"
                rx="3" ry="3" fill="${color}" opacity="0.92"/>
          <text class="bar-label" x="${x + barW / 2}" y="${H - 12}"
                text-anchor="middle" font-size="9" fill="#64748B">${label}</text>
        </g>`;
    }).join('');

    const ticks = [0, 0.5, 1].map((t) => {
      const val = Math.round(maxVal * t);
      const y = padT + chartH - t * chartH;
      return `
        <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"
              stroke="#E2E8F0" stroke-width="1"/>
        <text x="${padL - 4}" y="${y + 3}" text-anchor="end"
              font-size="9" fill="#94A3B8">${val}</text>`;
    }).join('');

    return `
      <div class="chart-card">
        <div class="chart-legend">
          <span class="leg"><i class="leg-dot ok"></i> Puntual</span>
          <span class="leg"><i class="leg-dot late"></i> Minutos de tardanza</span>
        </div>
        <svg class="bar-chart" viewBox="0 0 ${W} ${H}" role="img"
             aria-label="Minutos de tardanza por día">
          ${ticks}
          ${bars}
        </svg>
        <p class="chart-caption">Eje Y: minutos de tardanza · Eje X: día del mes</p>
      </div>`;
  },

  renderPerformance(stats, history) {
    const k = stats.kpis;
    const periodo = stats.periodo;
    const meses = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mesLabel = (meses[periodo.mes] || '') + ' ' + periodo.anio;

    const kpiCards = [
      { label: 'Puntualidad', value: k.puntualidad_pct + '%', hint: 'Entradas a tiempo', tone: k.puntualidad_pct >= 80 ? 'ok' : k.puntualidad_pct >= 60 ? 'warn' : 'bad' },
      { label: 'Días laborados', value: String(k.dias_laborados), hint: 'Con marcaje de entrada', tone: 'info' },
      { label: 'Entradas tarde', value: String(k.entradas_tarde), hint: 'Este mes', tone: k.entradas_tarde === 0 ? 'ok' : 'warn' },
      { label: 'Min. de tardanza', value: String(k.minutos_tardanza_mes), hint: k.horas_tardanza + ' h acumuladas', tone: k.minutos_tardanza_mes === 0 ? 'ok' : 'bad' },
      { label: 'Prom. tardanza', value: k.promedio_tardanza_min + ' min', hint: 'Cuando llega tarde', tone: 'info' },
      { label: 'Salidas anticipadas', value: String(k.salidas_anticipadas), hint: 'Antes del horario', tone: k.salidas_anticipadas === 0 ? 'ok' : 'warn' }
    ].map((c, i) => `
      <div class="kpi-card kpi-${c.tone} anim-fade-up" style="animation-delay:${i * 0.05}s">
        <div class="kpi-value">${c.value}</div>
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-hint">${c.hint}</div>
      </div>`).join('');

    const chartHtml = this.buildTardinessBarChart(stats.timeline || []);

    const timeline = (stats.timeline || []).map((day) => {
      const d = new Date(day.fecha + 'T12:00:00');
      const label = d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' });
      let badge = 'ok';
      let badgeText = 'Puntual';
      if (day.minutos_tardanza > 0) {
        badge = 'late';
        badgeText = '+' + day.minutos_tardanza + ' min';
      } else if (!day.completa) {
        badge = 'partial';
        badgeText = 'Incompleta';
      }
      return `
        <div class="tl-item">
          <div class="tl-dot ${badge}"></div>
          <div class="tl-content">
            <div class="tl-top">
              <span class="tl-date">${label}</span>
              <span class="tl-badge ${badge}">${badgeText}</span>
            </div>
            <div class="tl-meta">
              Entrada ${day.entrada_hora || '—'} · ${day.marcajes_count} marcaje(s)
              ${day.completa ? ' · jornada completa' : ''}
            </div>
          </div>
        </div>`;
    }).join('') || '<p class="empty-hint">Aún no hay marcajes en el período.</p>';

    const lateDays = (history.dias || []).filter((d) => d.tarde).slice(0, 8);
    const lateCards = lateDays.length
      ? lateDays.map((d) => {
          const label = new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-GT', {
            weekday: 'short', day: 'numeric', month: 'short'
          });
          const entrada = (d.marcajes || []).find((m) => m.tipo === 'ENTRADA');
          return `
            <div class="late-card">
              <div class="late-date">${label}</div>
              <div class="late-min">+${d.minutos_tardanza} min</div>
              <div class="late-hora">Entrada ${entrada ? entrada.hora.slice(0, 5) : '—'}</div>
            </div>`;
        }).join('')
      : '<p class="empty-hint">Sin entradas tarde este mes. ¡Buen trabajo!</p>';

    document.getElementById('perf-content').innerHTML = `
      <p class="perf-period">Período: <strong>${mesLabel}</strong></p>
      <div class="kpi-grid">${kpiCards}</div>

      <section class="perf-section">
        <h3 class="perf-section-title">Tardanza por día</h3>
        ${chartHtml}
      </section>

      <section class="perf-section">
        <h3 class="perf-section-title">Entradas tarde</h3>
        <div class="late-grid">${lateCards}</div>
      </section>

      <section class="perf-section">
        <h3 class="perf-section-title">Línea de tiempo</h3>
        <div class="timeline">${timeline}</div>
      </section>`;
  }
});
