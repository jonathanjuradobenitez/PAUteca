/* PAUteca · modelos interactivos de Física.
   Uso en el HTML de una solución: <div class='sim' data-sim='TIPO' data-p='{...json...}'></div>
   app.js llama a window.SIMS() después de cada render; cada caja se monta una sola vez. */
(function () {
  const C = { or: '#ea580c', bl: '#2563eb', rd: '#dc2626', gr: '#16a34a', pu: '#7c3aed', gy: '#64748b', am: '#d97706', tx: '#1e293b', lt: '#cbd5e1' };
  const FONT = '12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
  const nf = (v, d = 2) => {
    if (!isFinite(v)) return '—';
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e5 || a < 1e-2)) {
      const e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e);
      return m.toFixed(d).replace('.', ',') + '·10' + sup(e);
    }
    return v.toFixed(d).replace('.', ',');
  };
  const sup = e => String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '-' ? '⁻' : c)).join('');

  function css() {
    if (document.getElementById('simcss')) return;
    const s = document.createElement('style'); s.id = 'simcss';
    s.textContent = `.sim{margin:14px 0;padding:8px 8px 8px;}.sol .sim{margin-left:-11px;margin-right:-11px}.sim{border:1.5px solid #c7d2fe;border-radius:16px;background:linear-gradient(#eef2ff,#f8fafc 60px)}
.sim .st{font-weight:800;font-size:13px;color:#4338ca;margin:0 2px 8px;display:flex;gap:6px;align-items:center}
.sim .st:before{content:'🎛️'}
.sim canvas{display:block;margin:0 auto;border-radius:12px;background:#fff;touch-action:none;box-shadow:0 1px 3px #0001}
.sim .ct{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:10px;align-items:flex-end}
.sim label{font-size:12px;display:flex;flex-direction:column;flex:1 1 140px;min-width:130px;color:#334155}
.sim label span{display:flex;justify-content:space-between;gap:6px}.sim label b{color:#4338ca}
.sim input[type=range]{width:100%;accent-color:#6d28d9;margin:4px 0 0}
.sim .bt{display:flex;gap:6px;flex-wrap:wrap}
.sim button{border:0;border-radius:999px;padding:7px 12px;background:#ede9fe;color:#5b21b6;font-weight:700;font-size:12px;cursor:pointer}
.sim button.on{background:#6d28d9;color:#fff}
.sim .ro{font-size:12.5px;color:#1e293b;margin-top:8px;line-height:1.55;background:#fff;border-radius:10px;padding:6px 9px}
.sim .ro b{color:#4338ca}.sim .hint{font-size:11.5px;color:#64748b;margin:6px 2px 0}`;
    document.head.appendChild(s);
  }
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h !== undefined) e.innerHTML = h; return e; };

  /* ---------- base común: lienzo, controles, lectura y bucle ---------- */
  function base(box, H, title, hint) {
    box.innerHTML = '';
    const st = el('div', 'st', title), cv = document.createElement('canvas'), ct = el('div', 'ct'), ro = el('div', 'ro');
    box.append(st, cv, ct, ro);
    if (hint) box.append(el('div', 'hint', hint));
    const W = Math.max(260, Math.min(380, (box.clientWidth || 340) - 16)), dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.scale(dpr, dpr); g.font = FONT; g.lineCap = 'round'; g.lineJoin = 'round';
    const S = { W, H, g, cv, ct, ro, box };
    S.slider = (lab, min, max, step, val, fmt, on) => {
      const L = el('label'), sp = el('span'), b = el('b'), inp = document.createElement('input');
      inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
      sp.append(document.createTextNode(lab), b); L.append(sp, inp); ct.append(L);
      const upd = () => { b.textContent = fmt(+inp.value); };
      inp.addEventListener('input', () => { upd(); on(+inp.value); }); upd();
      return inp;
    };
    S.buttons = (list) => {
      const w = el('div', 'bt'); ct.append(w);
      return list.map(([t, f, on]) => { const b = el('button', on ? 'on' : '', t); b.type = 'button'; b.addEventListener('click', () => f(b)); w.append(b); return b; });
    };
    S.group = (btns, active) => { btns.forEach(b => b.classList.toggle('on', b === active)); };
    return S;
  }
  function loop(S, step) {
    let last = 0, vis = true;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(e => { vis = e[0].isIntersecting; }) : null;
    if (io) io.observe(S.box);
    function f(t) {
      if (!S.box.isConnected) { if (io) io.disconnect(); return; }
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      if (vis) step(dt);
      requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  /* ---------- dibujo ---------- */
  function arrow(g, x1, y1, x2, y2, col, lw = 2.2, lab, lx = 0, ly = 0) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const h = Math.min(9, L * 0.45);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - h * 0.7 * Math.cos(a), y2 - h * 0.7 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4)); g.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4)); g.closePath(); g.fill();
    if (lab) txt(g, lab, x2 + lx, y2 + ly, col, 'bold', 'center');
  }
  function txt(g, s, x, y, col = C.tx, w = '', al = 'left', size = 12) {
    g.fillStyle = col; g.font = (w ? w + ' ' : '') + size + 'px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(s, x, y);
  }
  function line(g, x1, y1, x2, y2, col, lw = 1.5, dash) {
    g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash || []); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
  }
  function circle(g, x, y, r, fill, stroke, lw = 1.5) {
    g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  function bars(g, x, y, w, items, scale, title) {
    // items: [label, value, color]; barras horizontales con cero en el centro si hay negativos
    const neg = items.some(i => i[1] < 0), x0 = neg ? x + w / 2 : x + 44, half = neg ? w / 2 - 46 : w - 92;
    if (title) txt(g, title, x, y - 10, C.gy, 'bold');
    items.forEach(([lab, v, col], i) => {
      const yy = y + i * 18, L = Math.max(-1, Math.min(1, v / scale)) * half;
      g.fillStyle = col; g.globalAlpha = 0.85; g.fillRect(Math.min(x0, x0 + L), yy - 6, Math.abs(L), 12); g.globalAlpha = 1;
      txt(g, lab, neg ? x : x, yy, col, 'bold');
    });
    line(g, x0, y - 9, x0, y + items.length * 18 - 8, C.gy, 1);
  }
  function plot(g, x, y, w, h, fn, t0, t1, ymax, col, lab, cursor) {
    line(g, x, y + h / 2, x + w, y + h / 2, C.lt, 1); line(g, x, y, x, y + h, C.lt, 1);
    g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= 120; i++) { const t = t0 + (t1 - t0) * i / 120, v = fn(t), px = x + w * i / 120, py = y + h / 2 - (v / ymax) * (h / 2 - 3); i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
    if (lab) txt(g, lab, x + 4, y + 8, col, 'bold');
    if (cursor !== undefined) { const px = x + w * (cursor - t0) / (t1 - t0); line(g, px, y, px, y + h, C.gy, 1, [3, 3]); }
  }
  function zig(g, x1, x2, y, n, amp, col) {
    g.strokeStyle = col; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x1, y);
    const L = x2 - x1, s = L / (n * 2 + 2);
    g.lineTo(x1 + s, y);
    for (let i = 0; i < n * 2; i++) g.lineTo(x1 + s * (i + 1.5), y + (i % 2 ? amp : -amp));
    g.lineTo(x2 - s, y); g.lineTo(x2, y); g.stroke();
  }

  /* =====================================================================
     1. PLANO INCLINADO (y tramo horizontal): fuerzas y balance de energía
     p: {m, ang, h, mu, F, v0, dir:'sube'|'baja', horiz, ts, g}
  ===================================================================== */
  function rampa(box, p) {
    const S = base(box, 250, p.titulo || 'Plano inclinado: fuerzas y energía', 'Pulsa ▶ para ver el movimiento. Cambia el rozamiento o el ángulo y observa cómo se reparte la energía.');
    const g0 = p.g || 9.8, m = p.m;
    let ang = p.ang, mu = p.mu, F = p.F || 0, h = p.h;
    let st;
    function reset() {
      const d = h / Math.sin(ang * Math.PI / 180);
      st = { d, u: p.dir === 'sube' ? 0 : d, v: p.dir === 'sube' ? (p.v0 || 0) : -(p.v0 || 0), x: 0, vx: 0, fase: 'rampa', Q: 0, WF: 0, run: false, fin: '' };
      const E0 = 0.5 * m * (p.v0 || 0) ** 2 + (p.dir === 'sube' ? 0 : m * g0 * h);
      st.Emax = Math.max(E0 + F * d, m * g0 * h, 1);
      draw();
    }
    function forces() {
      const a = ang * Math.PI / 180, N = m * g0 * Math.cos(a), P = m * g0;
      return { a, N, P, Px: P * Math.sin(a), Fr: mu * N };
    }
    function step(dt) {
      if (!st.run) return;
      const k = (p.ts || 1) * dt, f = forces();
      for (let i = 0; i < 20; i++) {
        const h2 = k / 20;
        if (st.fase === 'rampa') {
          let acc;
          const drive = F - f.Px; // hacia arriba +
          if (Math.abs(st.v) < 1e-6) {
            if (Math.abs(drive) > f.Fr) acc = (drive - Math.sign(drive) * f.Fr) / m; else { st.v = 0; st.run = false; st.fin = 'Se detiene sobre el plano: el rozamiento estático lo mantiene.'; break; }
          } else acc = (drive - Math.sign(st.v) * f.Fr) / m;
          const v1 = st.v + acc * h2;
          if (st.v !== 0 && Math.sign(v1) !== Math.sign(st.v)) { // se para
            st.Q += f.Fr * Math.abs(st.v * h2 / 2); st.WF += F * st.v * h2 / 2; st.u += st.v * h2 / 2; st.v = 0;
            if (Math.abs(drive) <= f.Fr) { st.run = false; st.fin = 'Se detiene en el plano tras recorrer ' + nf(Math.abs(st.u - (p.dir === 'sube' ? 0 : st.d))) + ' m.'; break; }
            continue;
          }
          const du = (st.v + v1) / 2 * h2;
          st.Q += f.Fr * Math.abs(du); st.WF += F * du; st.u += du; st.v = v1;
          if (st.u >= st.d) { st.u = st.d; st.run = false; st.fin = 'Llega al final de la rampa con v = ' + nf(Math.abs(st.v)) + ' m/s.'; break; }
          if (st.u <= 0) {
            st.u = 0;
            if (p.horiz) { st.fase = 'horiz'; st.vx = Math.abs(st.v); st.vb = st.vx; }
            else { st.run = false; st.fin = 'Llega abajo con v = ' + nf(Math.abs(st.v)) + ' m/s.'; break; }
          }
        } else {
          const Fr2 = mu * m * g0, acc = -Fr2 / m, v1 = st.vx + acc * h2;
          if (v1 <= 0) { st.x += st.vx * st.vx / (2 * Fr2 / m) * 0 + st.vx * h2 / 2; st.vx = 0; st.run = false; st.fin = 'Se detiene tras recorrer ' + nf(st.x, 1) + ' m en horizontal.'; break; }
          const dx = (st.vx + v1) / 2 * h2; st.Q += Fr2 * dx; st.x += dx; st.vx = v1;
        }
      }
      draw();
    }
    function draw() {
      const { g, W, H } = S, f = forces();
      g.clearRect(0, 0, W, H);
      const d = st.d, cosA = Math.cos(f.a), sinA = Math.sin(f.a);
      // longitud horizontal prevista (para la escala)
      let Lh = 0;
      if (p.horiz) { const vb2 = Math.max(0, 2 * (g0 * sinA - mu * g0 * cosA) * d + (p.v0 || 0) ** 2); Lh = vb2 / (2 * mu * g0 + 1e-9); Lh = Math.min(Lh, 6 * d * cosA + 1); }
      const top = 16, bot = H - 104, rampW = Lh > 0 ? (W - 40) * 0.45 : W - 40;
      const sc = Math.min(rampW / (d * cosA), (bot - top) / (d * sinA));
      const X0 = W - 20 - d * cosA * sc, Y0 = bot, sch = Lh > 0 ? (X0 - 18) / Lh : sc;
      // suelo y rampa
      g.fillStyle = '#e2e8f0'; g.beginPath(); g.moveTo(X0, Y0); g.lineTo(X0 + d * cosA * sc, Y0 - d * sinA * sc); g.lineTo(X0 + d * cosA * sc, Y0); g.closePath(); g.fill();
      line(g, 10, Y0, W - 10, Y0, C.gy, 2); line(g, X0, Y0, X0 + d * cosA * sc, Y0 - d * sinA * sc, C.gy, 2.5);
      txt(g, ang + '°', X0 + d * cosA * sc - 8, Y0 - 9, C.gy, 'bold', 'right');
      if (Lh > 0 && sch < sc * 0.7) txt(g, 'tramo horizontal (otra escala)', 16, Y0 + 12, C.gy, '', 'left', 10);
      // bloque
      let bx, by, rot, vdir;
      if (st.fase === 'rampa') { bx = X0 + st.u * cosA * sc; by = Y0 - st.u * sinA * sc; rot = -f.a; vdir = Math.sign(st.v); }
      else { bx = Math.max(14, X0 - st.x * sch); by = Y0; rot = 0; vdir = st.vx > 0 ? -1 : 0; }
      const s = 22;
      g.save(); g.translate(bx, by); g.rotate(rot); g.fillStyle = '#475569'; g.fillRect(-s / 2, -s, s, s); g.restore();
      const enR = st.fase === 'rampa';
      const ux = enR ? cosA : -1, uy = enR ? -sinA : 0;        // sentido "hacia arriba de la rampa" / hacia la izquierda en el suelo
      const nx = enR ? -sinA : 0, ny = enR ? -cosA : -1;        // normal hacia fuera de la superficie
      const cx = bx + nx * s / 2, cy = by + ny * s / 2;          // centro del bloque
      const Fmax = Math.max(m * g0, F, 1), k = 48 / Fmax;
      arrow(g, cx, cy, cx, cy + m * g0 * k, C.or, 2.2, 'P', 10, 0);
      const Nm = enR ? f.N : m * g0;
      arrow(g, cx, cy, cx + nx * Nm * k, cy + ny * Nm * k, C.bl, 2.2, 'N', -9, -6);
      const vv = enR ? st.v : st.vx;
      let mov = enR ? Math.sign(vv) : (st.vx > 0 ? 1 : 0);
      if (!mov && enR && !st.fin) mov = p.dir === 'sube' ? 1 : -1;
      if (mu > 0 && mov) {
        const fr = enR ? f.Fr : mu * m * g0;
        const dx = -mov * ux, dy = -mov * uy;
        arrow(g, cx + dx * s / 2, cy + dy * s / 2, cx + dx * (s / 2 + fr * k), cy + dy * (s / 2 + fr * k), C.rd, 2.2, 'Fr', dx * 12, 10);
      }
      if (F && enR) arrow(g, cx + ux * s / 2, cy + uy * s / 2, cx + ux * (s / 2 + F * k), cy + uy * (s / 2 + F * k), C.pu, 2.2, 'F', 0, -10);
      if (Math.abs(vv) > 0.01) {
        const dx = enR ? ux * Math.sign(vv) : -1, dy = enR ? uy * Math.sign(vv) : 0, ox = bx - nx * 12, oy = by - ny * 12;
        arrow(g, ox, oy, ox + dx * 32, oy + dy * 32, C.gr, 1.8, 'v', 0, 10);
      }
      // energías
      const hh = st.fase === 'rampa' ? st.u * sinA : 0, v = Math.abs(vv);
      const Ec = 0.5 * m * v * v, Ep = m * g0 * hh;
      const items = [['Ec', Ec, C.gr], ['Ep', Ep, C.or], ['Calor', st.Q, C.rd]];
      if (F) items.push(['W(F)', st.WF, C.pu]);
      bars(g, 12, H - 80, W - 110, items, st.Emax, '');
      txt(g, 'Ec ' + nf(Ec, 1) + ' J', W - 12, H - 80, C.gr, '', 'right');
      txt(g, 'Ep ' + nf(Ep, 1) + ' J', W - 12, H - 62, C.or, '', 'right');
      txt(g, 'Q ' + nf(st.Q, 1) + ' J', W - 12, H - 44, C.rd, '', 'right');
      if (F) txt(g, 'W ' + nf(st.WF, 1) + ' J', W - 12, H - 26, C.pu, '', 'right');
      S.ro.innerHTML = `<b>v</b> = ${nf(v)} m/s · <b>N</b> = ${nf(st.fase === 'rampa' ? f.N : m * g0, 1)} N · <b>F<sub>r</sub></b> = ${nf(st.fase === 'rampa' ? f.Fr : mu * m * g0, 1)} N` + (F ? ` · <b>F</b> = ${nf(F, 0)} N` : '') + (st.fin ? `<br>${st.fin}` : '') +
        `<br><span style="color:#64748b">E<sub>c</sub> + E<sub>p</sub> + calor${F ? ' − W(F)' : ''} = ${nf(Ec + Ep + st.Q - st.WF, 1)} J (se conserva)</span>`;
    }
    S.buttons([['▶ Iniciar', () => { if (!st.run && st.fin) reset(); st.run = true; }], ['⏸', () => { st.run = false; }], ['↺ Reiniciar', reset]]);
    S.slider('Coeficiente de rozamiento μ', 0, 0.6, 0.01, mu, v => nf(v), v => { mu = v; reset(); });
    S.slider('Ángulo (altura fija)', 10, 60, 1, ang, v => v + '°', v => { ang = v; reset(); });
    if (p.F) S.slider('Fuerza aplicada F', 0, Math.round(p.F * 1.6), 1, F, v => v + ' N', v => { F = v; reset(); });
    reset(); loop(S, step);
  }

  /* =====================================================================
     2. ÓRBITAS Y VELOCIDAD DE ESCAPE
     p: {modo:'orb'|'esc', r (en radios), m, M, R, astro, ve}
  ===================================================================== */
  function orbita(box, p) {
    const S = base(box, 260, p.titulo || 'Satélite en órbita y velocidad de escape', 'En «Órbita» cambia el radio: la gravedad hace de fuerza centrípeta. En «Escape» cambia la velocidad de lanzamiento y compárala con la de escape.');
    const G = 6.67e-11, M = p.M || 5.98e24, R = p.R || 6.37e6, m = p.m || 500, astro = p.astro || 'Tierra';
    let modo = p.modo || 'orb', r = p.r || 3, th = 0, ve_frac = p.vfrac || 0.8, esc = null;
    const vesc = Math.sqrt(2 * G * M / R);
    function startEsc() { esc = { r: 1, v: ve_frac, t: 0, max: 1, hist: [], done: '' }; }
    function step(dt) {
      if (modo === 'orb') { th += dt * 1.6 * Math.pow(1.5 / r, 1.5); }
      else if (esc && !esc.done) {
        // unidades: R = 1, v_e = 1  =>  GM = 1/2
        for (let i = 0; i < 40; i++) {
          const h = dt * 1.2 / 40, a = -0.5 / (esc.r * esc.r);
          esc.v += a * h; esc.r += esc.v * h; esc.t += h; esc.max = Math.max(esc.max, esc.r);
          if (esc.r <= 1) { esc.r = 1; esc.done = 'Vuelve a caer: su energía mecánica es negativa (no llega al infinito).'; break; }
          if (esc.r > 14) { esc.done = 'Escapa: E_m ≥ 0, se aleja indefinidamente.'; break; }
        }
      }
      draw();
    }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      if (modo === 'orb') {
        const cx = Math.round(W * 0.29), cy = 122, rmax = 8, sc = Math.min(104, W * 0.27) / rmax, Rp = Math.max(10, sc * 1);
        circle(g, cx, cy, r * sc + 0.01, null, C.lt, 1);
        const grd = g.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, Rp); grd.addColorStop(0, '#60a5fa'); grd.addColorStop(1, '#1d4ed8');
        circle(g, cx, cy, Rp, grd); txt(g, astro, cx, cy + Rp + 10, C.bl, 'bold', 'center', 11);
        const sx = cx + r * sc * Math.cos(th), sy = cy - r * sc * Math.sin(th);
        const v = Math.sqrt(G * M / (r * R)), v1 = Math.sqrt(G * M / (1.1 * R));
        arrow(g, sx, sy, sx - (sx - cx) / (r * sc) * 34 * Math.min(1, 2.5 / (r * r) + 0.25), sy - (sy - cy) / (r * sc) * 34 * Math.min(1, 2.5 / (r * r) + 0.25), C.or, 2.4, 'Fg', 0, -9);
        const tx = -Math.sin(th), ty = -Math.cos(th), Lv = 48 * v / v1;
        arrow(g, sx, sy, sx + tx * Lv, sy + ty * Lv, C.gr, 2.4, 'v', 8, 0);
        g.fillStyle = '#334155'; g.fillRect(sx - 5, sy - 4, 10, 8); line(g, sx - 11, sy, sx + 11, sy, '#94a3b8', 3);
        const rr = r * R, Ec = 0.5 * m * v * v, Ep = -G * M * m / rr, Em = Ec + Ep, ref = G * M * m / (1.6 * R);
        const bx0 = Math.round(W * 0.6), bw = W - bx0 - 6;
        bars(g, bx0, 40, bw, [['Ec', Ec, C.gr], ['Ep', Ep, C.or], ['Em', Em, C.pu]], ref, 'Energías');
        txt(g, '0', bx0 + bw / 2, 96, C.gy, '', 'center', 10); txt(g, 'r ↑: Ec ↓, Em ↑', bx0, 112, C.gy, '', 'left', 10);
        const T = 2 * Math.PI * rr / v;
        S.ro.innerHTML = `<b>r</b> = ${nf(r, 2)} R = ${nf(rr / 1000, 0)} km · <b>v<sub>orb</sub></b> = √(GM/r) = ${nf(v, 0)} m/s · <b>T</b> = ${nf(T / 3600, 2)} h<br><b>E<sub>c</sub></b> = ${nf(Ec)} J · <b>E<sub>p</sub></b> = ${nf(Ep)} J · <b>E<sub>m</sub></b> = −E<sub>c</sub> = ${nf(Em)} J`;
      } else {
        const x0 = 34, y0 = 130, Lmax = 14, sc = (W - 60) / Lmax;
        const grd = g.createRadialGradient(x0 - 4, y0 - 4, 2, x0, y0, sc); grd.addColorStop(0, '#60a5fa'); grd.addColorStop(1, '#1d4ed8');
        circle(g, x0, y0, sc, grd); txt(g, astro, x0, y0 + sc + 12, C.bl, 'bold', 'center', 11);
        line(g, x0 + sc, y0, W - 10, y0, C.lt, 1, [4, 4]);
        for (let k = 2; k <= 14; k += 2) { line(g, x0 + k * sc, y0 - 4, x0 + k * sc, y0 + 4, C.gy, 1); txt(g, k + 'R', x0 + k * sc, y0 + 14, C.gy, '', 'center', 9); }
        txt(g, '∞ →', W - 12, y0 - 14, C.gy, 'bold', 'right');
        const rr = esc ? esc.r : 1, vv = esc ? esc.v : ve_frac;
        const px = x0 + rr * sc;
        if (esc) { line(g, x0 + sc, y0 - 22, x0 + esc.max * sc, y0 - 22, C.pu, 2); txt(g, 'altura máx.', x0 + sc + 4, y0 - 32, C.pu, '', 'left', 10); }
        g.fillStyle = '#334155'; g.beginPath(); g.moveTo(px + 10, y0); g.lineTo(px - 6, y0 - 6); g.lineTo(px - 6, y0 + 6); g.closePath(); g.fill();
        if (Math.abs(vv) > 0.01) arrow(g, px + 12, y0, px + 12 + 40 * vv, y0, C.gr, 2.2, 'v', 0, -10);
        // energía mecánica en unidades de (1/2) m ve²
        const Em = vv * vv - 1 / rr, Ec = vv * vv;
        bars(g, 16, 210, W - 32, [['Ec', Ec, C.gr], ['Ep', -1 / rr, C.or], ['Em', Em, C.pu]], 1.6, '');
        const v0 = ve_frac * vesc;
        S.ro.innerHTML = `<b>v<sub>e</sub></b> = √(2GM/R) = ${nf(vesc, 0)} m/s · lanzamiento <b>v<sub>0</sub></b> = ${nf(ve_frac, 2)}·v<sub>e</sub> = ${nf(v0, 0)} m/s<br>` +
          `E<sub>m</sub> = ½mv² − GMm/r ${Em >= -1e-9 ? '≥ 0' : '< 0'}` + (esc && esc.done ? `<br>${esc.done}` : '');
      }
    }
    const bt = S.buttons([['Órbita', b => { modo = 'orb'; S.group(bt, b); ui(); }, modo === 'orb'], ['Escape', b => { modo = 'esc'; esc = null; S.group(bt, b); ui(); }, modo === 'esc']]);
    let sl = [];
    function ui() {
      sl.forEach(x => x.closest('label') ? x.closest('label').remove() : x.remove()); sl = [];
      if (modo === 'orb') sl.push(S.slider('Radio de la órbita', 1.1, 8, 0.01, r, v => nf(v, 2) + ' R', v => { r = v; draw(); }));
      else {
        sl.push(S.slider('Velocidad de lanzamiento', 0.3, 1.3, 0.01, ve_frac, v => nf(v, 2) + '·vₑ', v => { ve_frac = v; esc = null; draw(); }));
        const w = S.buttons([['🚀 Lanzar', () => startEsc()]]); sl.push(w[0].parentNode);
      }
      draw();
    }
    ui(); loop(S, step);
  }

  /* =====================================================================
     3. CAMPOS DE CARGAS O MASAS PUNTUALES (punto P arrastrable)
     p: {tipo:'elec'|'grav', q:[[x,y,valor,'nombre']], P:[x,y], box:[xmin,xmax,ymin,ymax], graf:bool, var:índice}
  ===================================================================== */
  function campos(box, p) {
    const grav = p.tipo === 'grav', K = grav ? 6.67e-11 : 9e9;
    const S = base(box, p.graf ? 330 : 270, p.titulo || (grav ? 'Campo gravitatorio de varias masas' : 'Campo eléctrico de varias cargas'), 'Arrastra el punto P. Se dibuja el campo de cada ' + (grav ? 'masa' : 'carga') + ' y el campo total (morado).');
    const Q = p.q.map(a => a.slice()); let P = p.P.slice();
    const [x0, x1, y0, y1] = p.box, plotH = p.graf ? 70 : 0;
    const Hm = S.H - plotH - 10, sc = Math.min((S.W - 20) / (x1 - x0), (Hm - 20) / (y1 - y0));
    const ox = S.W / 2 - sc * (x0 + x1) / 2, oy = 10 + (Hm - 20) / 2 + sc * (y0 + y1) / 2;
    const X = x => ox + x * sc, Y = y => oy - y * sc;
    function field(x, y) {
      let Ex = 0, Ey = 0, V = 0; const parts = [];
      Q.forEach(([qx, qy, q]) => {
        const dx = x - qx, dy = y - qy, r = Math.hypot(dx, dy) || 1e-9;
        const e = K * (grav ? -Math.abs(q) : q) / (r * r); // grav: hacia la masa
        parts.push([e * dx / r, e * dy / r]); Ex += e * dx / r; Ey += e * dy / r; V += K * (grav ? -Math.abs(q) : q) / r;
      });
      return { Ex, Ey, V, parts };
    }
    let ref = 0;
    function setRef() { const f = field(P[0], P[1]); ref = Math.max(...f.parts.map(v => Math.hypot(...v)), Math.hypot(f.Ex, f.Ey)) || 1; }
    function draw() {
      const { g, W } = S; g.clearRect(0, 0, W, S.H);
      // rejilla
      for (let x = Math.ceil(x0); x <= x1; x++) line(g, X(x), Y(y0), X(x), Y(y1), x === 0 ? C.gy : '#eef2f7', x === 0 ? 1.2 : 1);
      for (let y = Math.ceil(y0); y <= y1; y++) line(g, X(x0), Y(y), X(x1), Y(y), y === 0 ? C.gy : '#eef2f7', y === 0 ? 1.2 : 1);
      txt(g, 'x (m)', X(x1) - 2, Y(0) - 8, C.gy, '', 'right', 10); txt(g, 'y (m)', X(0) + 6, Y(y1) + 8, C.gy, '', 'left', 10);
      const f = field(P[0], P[1]), cols = [C.bl, C.gr, C.am, C.rd];
      const Lsc = v => 64 * Math.sqrt(Math.min(4, v / ref));
      f.parts.forEach((v, i) => { const m = Math.hypot(...v), L = Lsc(m); arrow(g, X(P[0]), Y(P[1]), X(P[0]) + v[0] / m * L, Y(P[1]) - v[1] / m * L, cols[i % 4], 2, (grav ? 'g' : 'E') + (i + 1), 0, -9); });
      const mt = Math.hypot(f.Ex, f.Ey);
      if (mt > ref * 1e-6) { const L = Lsc(mt); arrow(g, X(P[0]), Y(P[1]), X(P[0]) + f.Ex / mt * L, Y(P[1]) - f.Ey / mt * L, C.pu, 3, grav ? 'g' : 'E', 0, -10); }
      Q.forEach(([qx, qy, q, nm], i) => {
        const col = grav ? '#475569' : (q > 0 ? C.rd : C.bl);
        circle(g, X(qx), Y(qy), grav ? 9 : 10, col);
        txt(g, grav ? '' : (q > 0 ? '+' : '−'), X(qx), Y(qy) + 1, '#fff', 'bold', 'center', 13);
        txt(g, nm || ((grav ? 'm' : 'q') + (i + 1)), X(qx) + 13, Y(qy) - 11, col, 'bold', 'left', 11);
      });
      circle(g, X(P[0]), Y(P[1]), 7, '#fff', C.pu, 2.5); txt(g, 'P', X(P[0]) - 12, Y(P[1]) + 12, C.pu, 'bold', 'center');
      if (p.graf) {
        // E_x y V a lo largo del eje de las cargas
        const yb = S.H - plotH - 2, xa = Q[0][0], xb = Q[1][0];
        let vmax = 0, emax = 0;
        const pts = [];
        for (let i = 0; i <= 160; i++) { const x = x0 + (x1 - x0) * i / 160, fx = field(x, 0); pts.push([x, fx.Ex, fx.V]); }
        pts.forEach(q => { if (Math.abs(q[0] - xa) > 0.15 && Math.abs(q[0] - xb) > 0.15) { emax = Math.max(emax, Math.abs(q[1])); vmax = Math.max(vmax, Math.abs(q[2])); } });
        line(g, X(x0), yb + plotH / 2, X(x1), yb + plotH / 2, C.lt, 1);
        [[1, C.pu, 'Eₓ', emax], [2, C.am, 'V', vmax]].forEach(([k, col, lb, mx]) => {
          g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); let on = false;
          pts.forEach(q => { const near = Math.abs(q[0] - xa) < 0.12 || Math.abs(q[0] - xb) < 0.12; if (near) { on = false; return; } const yy = yb + plotH / 2 - Math.max(-1, Math.min(1, q[k] / mx)) * (plotH / 2 - 4); on ? g.lineTo(X(q[0]), yy) : g.moveTo(X(q[0]), yy); on = true; });
          g.stroke(); txt(g, lb, X(x0) + (k === 1 ? 4 : 28), yb + 8, col, 'bold');
        });
        txt(g, 'a lo largo del eje x', X(x1) - 4, yb + 8, C.gy, '', 'right', 10);
      }
      const u = grav ? 'N/kg' : 'N/C', uv = grav ? 'J/kg' : 'V';
      S.ro.innerHTML = `P(${nf(P[0], 2)}, ${nf(P[1], 2)}) m · <b>${grav ? 'g' : 'E'}</b> = (${nf(f.Ex)}, ${nf(f.Ey)}) ${u} · |${grav ? 'g' : 'E'}| = ${nf(mt)} ${u}<br><b>V</b> = ${nf(f.V)} ${uv}` +
        (p.graf ? ` · ${mt < ref * 0.02 ? '<b style="color:#16a34a">¡Campo casi nulo!</b>' : ''} ${Math.abs(f.V) < 0.02 * Math.abs(K * Q[0][2]) ? '<b style="color:#d97706">¡Potencial casi nulo!</b>' : ''}` : '');
    }
    let drag = false;
    const pos = ev => { const r = S.cv.getBoundingClientRect(); return [(ev.clientX - r.left - ox) / sc, (oy - (ev.clientY - r.top)) / sc]; };
    S.cv.addEventListener('pointerdown', ev => { const q = pos(ev); if (Math.hypot(q[0] - P[0], q[1] - P[1]) * sc < 30 || true) { drag = true; S.cv.setPointerCapture(ev.pointerId); P = clampP(q); draw(); } });
    S.cv.addEventListener('pointermove', ev => { if (!drag) return; P = clampP(pos(ev)); draw(); });
    const up = () => { drag = false; }; S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
    function clampP(q) { return [Math.max(x0, Math.min(x1, Math.round(q[0] * 20) / 20)), Math.max(y0, Math.min(y1, Math.round(q[1] * 20) / 20))]; }
    if (p.var !== undefined) {
      const i = p.var, q0 = p.q[i][2];
      S.slider('Valor de ' + (p.q[i][3] || 'q' + (i + 1)), -Math.abs(q0) * 3, Math.abs(q0) * 3, Math.abs(q0) / 10, q0, v => nf(v * 1e6, 1) + ' μC', v => { Q[i][2] = Math.abs(v) < 1e-12 ? 1e-12 : v; draw(); });
    }
    S.buttons([['↺ Volver a P inicial', () => { P = p.P.slice(); Q.forEach((q, i) => q[2] = p.q[i][2]); draw(); }]]);
    setRef(); draw();
  }

  /* =====================================================================
     4. INDUCCIÓN ELECTROMAGNÉTICA
     p.modo: 'hilo' | 'giro' | 'bvar'
  ===================================================================== */
  function induccion(box, p) {
    const modo = p.modo || 'giro';
    const titles = { hilo: 'Espira junto a un hilo con corriente', giro: 'Espira girando en un campo uniforme', bvar: 'Espira en un campo magnético variable' };
    const hints = { hilo: 'Mueve la espira: sólo hay corriente inducida si cambia el flujo. El sentido lo da la ley de Lenz.', giro: 'El flujo es Φ = B·S·cos(ωt) y la fem, ε = −dΦ/dt. Cambia ω o el lado y mira cómo cambia la fem máxima.', bvar: 'El campo varía con el tiempo; la fem es la derivada del flujo cambiada de signo.' };
    const S = base(box, modo === 'hilo' ? 250 : 215, p.titulo || titles[modo], p.hint || hints[modo]);
    if (modo === 'hilo') {
      let d = 1, mov = 0, y = 0, hist = [], t = 0; const a = 1.2;
      const flux = dd => Math.log((dd + a) / dd);
      function step(dt) {
        t += dt; let dphi = 0;
        if (mov === 1) y += dt * 1.2; if (mov === 2) { const f0 = flux(d); d = Math.min(4.2, d + dt * 0.8); dphi = (flux(d) - f0) / dt; if (d >= 4.2) mov = 0; }
        if (mov === 3) { const f0 = flux(d); d = Math.max(0.35, d - dt * 0.8); dphi = (flux(d) - f0) / dt; if (d <= 0.35) mov = 0; }
        if (y > 1.4) y = -1.4;
        hist.push([t, flux(d), dphi]); if (hist.length > 160) hist.shift();
        draw(dphi);
      }
      function draw(dphi) {
        const { g, W, H } = S; g.clearRect(0, 0, W, H);
        const wx = 30, sc = Math.min(52, (W - 40) / 5.6), top = 14, bot = 170;
        line(g, wx, top, wx, bot, '#b45309', 4); arrow(g, wx, bot - 30, wx, top + 40, '#b45309', 3, 'I', -10, 0);
        for (let i = 1; i <= 6; i++) for (let j = 0; j < 5; j++) {
          const xx = wx + i * (W - wx - 10) / 6.3, yy = top + 12 + j * 34, B = 1 / (i * (W - wx - 10) / 6.3 / sc);
          g.globalAlpha = Math.min(1, 0.25 + B * 0.6); const k = 3 + Math.min(4, B * 4);
          line(g, xx - k, yy - k, xx + k, yy + k, C.gy, 1.3); line(g, xx - k, yy + k, xx + k, yy - k, C.gy, 1.3); g.globalAlpha = 1;
        }
        txt(g, 'B entrante (×), más intenso cerca del hilo', wx + 8, bot + 12, C.gy, '', 'left', 10);
        const lx = wx + d * sc, ly = (top + bot) / 2 - a * sc / 2 + y * 30;
        g.strokeStyle = C.bl; g.lineWidth = 3; g.strokeRect(lx, ly, a * sc, a * sc);
        if (Math.abs(dphi) > 1e-4) {
          const cx = lx + a * sc / 2, cy = ly + a * sc / 2, r = a * sc / 2 - 12, hor = dphi < 0; // flujo entrante disminuye -> horario
          g.strokeStyle = C.rd; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cy, r, 0.3, 2 * Math.PI - 0.3, !hor ? true : false); g.stroke();
          const ang = hor ? 2 * Math.PI - 0.3 : 0.3, ex = cx + r * Math.cos(ang), ey = cy + r * Math.sin(ang);
          const tx = hor ? -Math.sin(ang) : Math.sin(ang), ty = hor ? Math.cos(ang) : -Math.cos(ang);
          arrow(g, ex - tx * 8, ey - ty * 8, ex + tx * 2, ey + ty * 2, C.rd, 2.2);
          txt(g, hor ? 'I ind. horaria' : 'I ind. antihoraria', cx, cy, C.rd, 'bold', 'center', 11);
        }
        line(g, 12, H - 8, W - 12, H - 8, C.lt, 1); line(g, 12, H - 64, 12, H - 8, C.lt, 1);
        const fx = hist.map(h => h[1]), fmax = flux(0.35);
        g.strokeStyle = C.bl; g.lineWidth = 2; g.beginPath(); hist.forEach((h, i) => { const px = 12 + (W - 24) * i / 160, py = H - 64 + 56 - (h[1] / fmax) * 52; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
        txt(g, 'Φ (flujo)', 16, H - 58, C.bl, 'bold');
        S.ro.innerHTML = `Distancia al hilo <b>d</b> = ${nf(d, 2)}·a · Φ ∝ ln((d+a)/d) = ${nf(flux(d), 3)}<br>` + (Math.abs(dphi) > 1e-4 ? `El flujo ${dphi < 0 ? 'disminuye' : 'aumenta'}: la corriente inducida crea un campo ${dphi < 0 ? 'entrante que lo refuerza' : 'saliente que se opone'} (ley de Lenz).` : 'El flujo no cambia: <b>no hay corriente inducida</b>.');
      }
      const bt = S.buttons([['↕ Paralelo al hilo', b => { mov = 1; S.group(bt, b); }], ['→ Alejar', b => { mov = 2; S.group(bt, b); }], ['← Acercar', b => { mov = 3; S.group(bt, b); }], ['⏸ Parar', b => { mov = 0; S.group(bt, b); }]]);
      loop(S, step);
      return;
    }
    // giro y bvar comparten gráficas de flujo y fem
    let w = p.w || 157.08, Sarea = p.S || 4e-3, B0 = p.B || 0.25, N = p.N || 1, Rres = p.Rres || 10, fac = 1, lado = 1, t = 0;
    const slow = p.slow || 60; // cámara lenta
    const forma = p.forma || (modo === 'giro' ? 'cos' : 'sen'); // flujo cos(ωt) o sen(ωt)
    function step(dt) { t += dt / slow; draw(); }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      const ww = w * fac, Ss = Sarea * lado * lado, ph = ww * t;
      const Phi0 = N * B0 * Ss, eps0 = Phi0 * ww;
      const Phi = tt => Phi0 * (forma === 'cos' ? Math.cos(ww * tt) : Math.sin(ww * tt));
      const eps = tt => (forma === 'cos' ? 1 : -1) * eps0 * (forma === 'cos' ? Math.sin(ww * tt) : Math.cos(ww * tt));
      const cx = 70, cy = 82, gx = 150;
      if (modo === 'giro') {
        for (let j = 0; j < 5; j++) arrow(g, 8, 22 + j * 30, 138, 22 + j * 30, '#cbd5e1', 1.6);
        txt(g, 'B', 140, 22, C.gy, 'bold');
        const half = 32 * Math.min(1.6, lado * 0.8 + 0.2), wid = half * Math.abs(Math.cos(ph));
        g.fillStyle = 'rgba(37,99,235,.15)'; g.fillRect(cx - wid, cy - half, 2 * wid, 2 * half);
        g.strokeStyle = C.bl; g.lineWidth = 3; g.strokeRect(cx - wid, cy - half, 2 * wid, 2 * half);
        line(g, cx, cy - half - 14, cx, cy + half + 14, C.gy, 1.2, [4, 3]); txt(g, 'eje', cx + 4, cy - half - 12, C.gy, '', 'left', 10);
        arrow(g, cx, cy, cx + 40 * Math.cos(ph), cy, C.pu, 2.2, 'n', 0, -9);
        txt(g, 'θ = ωt = ' + ((ph * 180 / Math.PI) % 360).toFixed(0) + '°', cx, 160, C.pu, 'bold', 'center', 11);
      } else {
        const Bt = (forma === 'cos' ? Math.cos(ph) : Math.sin(ph));
        circle(g, cx, cy, 46, 'rgba(37,99,235,.08)', C.bl, 3);
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
          const xx = cx + i * 22, yy = cy + j * 22; if (Math.hypot(i, j) > 2.3) continue;
          const k = 2 + 4 * Math.abs(Bt); g.globalAlpha = 0.25 + 0.75 * Math.abs(Bt);
          if (Bt >= 0) { circle(g, xx, yy, k, C.gy); } else { line(g, xx - k, yy - k, xx + k, yy + k, C.gy, 1.4); line(g, xx - k, yy + k, xx + k, yy - k, C.gy, 1.4); }
          g.globalAlpha = 1;
        }
        txt(g, Bt >= 0 ? 'B saliente (•)' : 'B entrante (×)', cx, 146, C.gy, 'bold', 'center', 11);
        const e = eps(t);
        if (Math.abs(e) > eps0 * 0.05) { const hor = (e < 0); g.strokeStyle = C.rd; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 56, -1.2, -0.2, hor ? false : true); g.stroke(); txt(g, hor ? 'I horaria' : 'I antihoraria', cx, 12, C.rd, 'bold', 'center', 11); }
      }
      const T = 2 * Math.PI / ww, t0 = t - 2 * T;
      plot(g, gx, 14, W - gx - 6, 64, Phi, t0, t, Phi0 * 1.05, C.bl, 'Φ', t);
      const emax = Math.max(eps0, 1e-12) * 1.05;
      plot(g, gx, 92, W - gx - 6, 64, eps, t0, t, p.emaxRef ? Math.max(emax, p.emaxRef) : emax, C.rd, 'ε', t);
      const I0 = eps0 / Rres;
      S.ro.innerHTML = `<b>Φ</b><sub>máx</sub> = ${N > 1 ? 'N·' : ''}B·S = ${nf(Phi0)} Wb · <b>ω</b> = ${nf(ww, 1)} rad/s (f = ${nf(ww / 2 / Math.PI, 2)} Hz)<br><b>ε<sub>máx</sub></b> = ${N > 1 ? 'N·' : ''}B·S·ω = ${nf(eps0)} V · <b>I<sub>máx</sub></b> = ε<sub>máx</sub>/R = ${nf(I0)} A` +
        (fac !== 1 || lado !== 1 ? `<br>Respecto al enunciado: ε<sub>máx</sub> ×${nf(fac * lado * lado, 2)}` : '') + `<br><span style="color:#64748b">Animación a cámara lenta (×1/${slow}).</span>`;
      // dibujo de la escala de tiempo
      txt(g, '← últimos 2 periodos', W - 8, 168, C.gy, '', 'right', 10);
    }
    S.slider(modo === 'giro' ? 'Velocidad de giro (×)' : 'Frecuencia (×)', 0.1, 4, 0.05, 1, v => '×' + nf(v, 2), v => { fac = v; });
    if (modo === 'giro' && p.lado) S.slider('Lado de la espira (×)', 0.5, 3, 0.1, 1, v => '×' + nf(v, 1), v => { lado = v; });
    loop(S, step);
  }

  /* =====================================================================
     5. PARTÍCULA CARGADA EN UN CAMPO MAGNÉTICO
     p.modo: 'comp' (protón y electrón) | 'alfa' (acelerada por ΔV)
  ===================================================================== */
  function particula(box, p) {
    const modo = p.modo || 'comp';
    const S = base(box, 260, p.titulo || (modo === 'comp' ? 'Protón y electrón en un campo magnético' : 'Partícula α en un campo magnético'),
      modo === 'comp' ? 'B entra en el papel (⊗). Misma velocidad y misma |q|: misma fuerza, sentidos opuestos. El radio R = mv/(|q|B) depende de la masa.' : 'Primero se acelera con ΔV (E_c = qΔV) y luego describe media circunferencia de radio R = mv/(qB) dentro del campo.');
    let t = 0, Bf = 1, vf = 1, dV = p.dV || 5000, B = p.B || 0.25, real = false;
    function step(dt) { t += dt; draw(); }
    // trayectoria: tramo recto de entrada (u<0,25) y media circunferencia dentro del campo
    function tray(g, xb, y0, R, s, col, u) {
      const cyc = y0 - s * R; // s=+1 se curva hacia arriba, s=−1 hacia abajo
      g.strokeStyle = col; g.lineWidth = 1.5; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(8, y0); g.lineTo(xb, y0); g.stroke();
      g.beginPath(); g.arc(xb, cyc, R, -Math.PI / 2, Math.PI / 2); g.stroke(); g.setLineDash([]);
      let px, py, tx, ty, inF = false;
      if (u < 0.25) { px = 8 + (xb - 8) * u / 0.25; py = y0; tx = 1; ty = 0; }
      else { const ph = (u - 0.25) / 0.75 * Math.PI, a = s > 0 ? Math.PI / 2 - ph : -Math.PI / 2 + ph; px = xb + R * Math.cos(a); py = cyc + R * Math.sin(a); tx = s > 0 ? Math.sin(a) : -Math.sin(a); ty = s > 0 ? -Math.cos(a) : Math.cos(a); inF = true; }
      circle(g, px, py, 6, col); txt(g, s > 0 ? '+' : '−', px, py + 1, '#fff', 'bold', 'center', 10);
      arrow(g, px, py, px + tx * 26, py + ty * 26, C.gr, 1.8);
      if (inF) arrow(g, px, py, px + (xb - px) / R * 24, py + (cyc - py) / R * 24, C.or, 1.8);
      return cyc;
    }
    function campoB(g, xb, W, H) {
      for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) { const xx = xb + 18 + i * 34, yy = 14 + j * 34; if (xx > W - 8 || yy > H - 40) continue; line(g, xx - 3, yy - 3, xx + 3, yy + 3, '#cbd5e1', 1.2); line(g, xx - 3, yy + 3, xx + 3, yy - 3, '#cbd5e1', 1.2); }
      line(g, xb, 4, xb, H - 34, C.gy, 1, [4, 3]); txt(g, 'B ⊗ (entrante)', xb + 6, H - 26, C.gy, 'bold', 'left', 11);
    }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      if (modo === 'comp') {
        const xb = 70, y0 = H - 92, u = (t % 4) / 4;
        campoB(g, xb, W, H);
        const Rp = Math.min((y0 - 10) / 2, 80 * vf / Bf), Re = real ? Rp / 1836 : Math.max(6, Rp / 8);
        tray(g, xb, y0, Rp, +1, C.rd, u); tray(g, xb, y0, Math.max(Re, 0.6), -1, C.bl, u);
        txt(g, 'protón', xb + Rp + 6, y0 - Rp, C.rd, 'bold', 'left', 11);
        txt(g, 'electrón', xb + Math.max(Re, 0.6) + 8, y0 + Math.max(Re, 0.6) + 4, C.bl, 'bold', 'left', 11);
        txt(g, 'v', 12, y0 - 10, C.gr, 'bold'); txt(g, 'F →centro', W - 8, 12, C.or, 'bold', 'right', 10);
        S.ro.innerHTML = `|F| = |q|·v·B: <b>igual para los dos</b> (q = ±e), con sentidos opuestos.<br>R = mv/(|q|B) ⇒ R<sub>p</sub>/R<sub>e</sub> = m<sub>p</sub>/m<sub>e</sub> ≈ 1836: el protón describe la circunferencia mayor; el electrón tiene más aceleración (a = F/m).` + (real ? '' : '<br><span style="color:#64748b">Radio del electrón ampliado para que se vea (en realidad es 1836 veces menor).</span>');
      } else {
        const xb = 66, y0 = H - 50, u = (t % 4) / 4;
        campoB(g, xb, W, H);
        const m = p.m || 6.7e-27, q = p.q || 3.2e-19, v = Math.sqrt(2 * q * dV / m), R = m * v / (q * B);
        const Rpx = Math.min((y0 - 12) / 2, R * 1500);
        g.fillStyle = '#fee2e2'; g.fillRect(6, y0 - 20, 20, 40); g.fillStyle = '#dbeafe'; g.fillRect(34, y0 - 20, 20, 40);
        txt(g, '+', 16, y0 - 28, C.rd, 'bold', 'center'); txt(g, '−', 44, y0 - 28, C.bl, 'bold', 'center'); txt(g, 'ΔV', 30, y0 + 30, C.gy, 'bold', 'center', 11);
        const cyc = tray(g, xb, y0, Rpx, +1, C.rd, u);
        line(g, xb, cyc, xb + Rpx, cyc, C.pu, 1.5); txt(g, 'R', xb + Rpx / 2, cyc - 9, C.pu, 'bold', 'center');
        S.ro.innerHTML = `E<sub>c</sub> = qΔV = ${nf(q * dV)} J → <b>v</b> = √(2qΔV/m) = ${nf(v)} m/s<br><b>R</b> = mv/(qB) = <b>${nf(R * 100, 2)} cm</b>` + (R * 1500 > Rpx ? ' (dibujo reducido)' : ' (escala: 1 cm ≈ 15 px)');
      }
    }
    if (modo === 'comp') {
      S.slider('Campo B (×)', 0.6, 2, 0.05, 1, v => '×' + nf(v, 2), v => { Bf = v; });
      S.slider('Velocidad (×)', 0.5, 1.5, 0.05, 1, v => '×' + nf(v, 2), v => { vf = v; });
      S.buttons([['Ver radios a escala real', bb => { real = !real; bb.classList.toggle('on', real); }]]);
    } else {
      S.slider('Diferencia de potencial ΔV', 1000, 10000, 100, dV, v => nf(v, 0) + ' V', v => { dV = v; });
      S.slider('Campo magnético B', 0.1, 0.6, 0.01, B, v => nf(v, 2) + ' T', v => { B = v; });
    }
    loop(S, step);
  }

  /* =====================================================================
     6. MOVIMIENTO ARMÓNICO SIMPLE (masa-muelle) con energías
     p: {A, m, k}
  ===================================================================== */
  function mas(box, p) {
    const S = base(box, 270, p.titulo || 'Oscilador masa-muelle: posición y energías', 'La energía potencial es máxima en los extremos y la cinética en el centro; la mecánica, ½kA², no cambia.');
    let A = p.A || 0.05, m = p.m || 0.2, k = p.k || 3.2, t = 0, run = true;
    function step(dt) { if (run) t += dt; draw(); }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      const w = Math.sqrt(k / m), x = A * Math.cos(w * t), v = -A * w * Math.sin(w * t);
      const Amax = 0.1, sc = (W / 2 - 50) / Amax, cx = W / 2 + 20, y0 = 48;
      g.fillStyle = '#94a3b8'; g.fillRect(8, 18, 8, 60); line(g, 8, 78, W - 8, 78, C.gy, 1.5);
      const bx = cx + x * sc; zig(g, 16, bx - 16, y0, 9, 8, C.gy);
      g.fillStyle = '#475569'; g.fillRect(bx - 16, y0 - 16, 32, 32); txt(g, 'm', bx, y0, '#fff', 'bold', 'center');
      line(g, cx, 26, cx, 90, C.gr, 1, [3, 3]); txt(g, '0', cx, 96, C.gr, 'bold', 'center', 10);
      line(g, cx - A * sc, 84, cx - A * sc, 92, C.pu, 1.5); line(g, cx + A * sc, 84, cx + A * sc, 92, C.pu, 1.5); txt(g, '−A', cx - A * sc, 100, C.pu, '', 'center', 10); txt(g, '+A', cx + A * sc, 100, C.pu, '', 'center', 10);
      if (Math.abs(v) > 1e-4) arrow(g, bx, y0 - 24, bx + Math.sign(v) * Math.min(50, Math.abs(v) / (A * w + 1e-9) * 50), y0 - 24, C.gr, 2, 'v', 0, -9);
      arrow(g, bx, y0 + 22, bx - Math.sign(x) * Math.min(46, Math.abs(x) / Amax * 46 * 2), y0 + 22, C.or, 2, Math.abs(x) > 1e-3 ? 'F = −kx' : '', 0, 10);
      // gráfica de energías frente a x
      const gy0 = H - 30, gh = 120, E = 0.5 * k * A * A, Emax = 0.5 * k * Amax * Amax * 0.6 + 1e-9, Es = Math.max(E, 1e-9) * 1.1;
      line(g, cx - Amax * sc, gy0, cx + Amax * sc, gy0, C.gy, 1.2); txt(g, 'x', cx + Amax * sc + 6, gy0, C.gy, '', 'left', 10);
      const ys = e => gy0 - (e / Es) * gh;
      g.strokeStyle = C.or; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 100; i++) { const xx = -A + 2 * A * i / 100; const yy = ys(0.5 * k * xx * xx); i ? g.lineTo(cx + xx * sc, yy) : g.moveTo(cx + xx * sc, yy); } g.stroke();
      g.strokeStyle = C.gr; g.beginPath(); for (let i = 0; i <= 100; i++) { const xx = -A + 2 * A * i / 100; const yy = ys(E - 0.5 * k * xx * xx); i ? g.lineTo(cx + xx * sc, yy) : g.moveTo(cx + xx * sc, yy); } g.stroke();
      line(g, cx - A * sc, ys(E), cx + A * sc, ys(E), C.pu, 2);
      const Ep = 0.5 * k * x * x, Ec = E - Ep;
      line(g, bx, gy0, bx, ys(E), C.gy, 1, [3, 3]); circle(g, bx, ys(Ep), 4, C.or); circle(g, bx, ys(Ec), 4, C.gr);
      txt(g, 'Eₚ', cx + A * sc + 4, ys(E) + 10, C.or, 'bold'); txt(g, 'Ec', cx - 8, ys(E) + 12, C.gr, 'bold', 'right'); txt(g, 'Eₘ', cx + A * sc + 4, ys(E) - 8, C.pu, 'bold');
      S.ro.innerHTML = `<b>ω</b> = √(k/m) = ${nf(w)} rad/s · <b>T</b> = ${nf(2 * Math.PI / w, 3)} s · <b>v<sub>máx</sub></b> = Aω = ${nf(A * w, 3)} m/s<br>x = ${nf(x * 100, 2)} cm · E<sub>c</sub> = ${nf(Ec * 1000, 2)} mJ · E<sub>p</sub> = ${nf(Ep * 1000, 2)} mJ · <b>E<sub>m</sub></b> = ½kA² = ${nf(E * 1000, 2)} mJ`;
    }
    S.buttons([['⏯', () => { run = !run; }], ['↺ Desde el extremo', () => { t = 0; }]]);
    S.slider('Amplitud A', 0.01, 0.1, 0.005, A, v => nf(v * 100, 1) + ' cm', v => { A = v; });
    S.slider('Masa m', 0.05, 1, 0.05, m, v => nf(v, 2) + ' kg', v => { m = v; t = 0; });
    S.slider('Constante k', 0.5, 12, 0.1, k, v => nf(v, 1) + ' N/m', v => { k = v; t = 0; });
    loop(S, step);
  }

  /* =====================================================================
     7. ONDAS: viajera, cambio de medio y estacionaria
     p.modo: 'viajera' | 'medios' | 'estacionaria'
  ===================================================================== */
  function onda(box, p) {
    const modo = p.modo || 'viajera';
    const titles = { viajera: 'Onda armónica viajera', medios: 'Una onda cambia de medio', estacionaria: 'Onda estacionaria' };
    const hints = { viajera: 'La cresta marcada avanza con la velocidad de propagación v = ω/k; el punto rojo sólo sube y baja (velocidad de oscilación).', medios: 'La frecuencia no cambia al pasar de medio; cambian la velocidad y la longitud de onda.', estacionaria: 'Mueve el punto rojo: en los nodos la amplitud es nula y la partícula está siempre en reposo. Activa las dos ondas viajeras para ver de dónde sale.' };
    const S = base(box, 220, p.titulo || titles[modo], hints[modo]);
    let t = 0, xp = p.x0 !== undefined ? p.x0 : 0.25, comp = false, run = true;
    const Lv = p.L || 2; // longitudes de onda visibles (viajera) o metros (estacionaria)
    function step(dt) { if (run) t += dt; draw(); }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      const x0 = 14, x1 = W - 14, ym = 92, Ay = 52;
      line(g, x0, ym, x1, ym, C.lt, 1);
      if (modo === 'viajera' || modo === 'medios') {
        const T = 2.2, w = 2 * Math.PI / T; // tiempo visual
        const lam1 = (x1 - x0) / Lv, lam2 = modo === 'medios' ? lam1 / 2 : lam1, xb = modo === 'medios' ? (x0 + x1) / 2 : x1 + 1;
        if (modo === 'medios') { g.fillStyle = '#eef2ff'; g.fillRect(xb, 8, x1 - xb, 168); txt(g, 'medio 1', x0 + 4, 16, C.gy, 'bold'); txt(g, 'medio 2', xb + 4, 16, C.gy, 'bold'); }
        const ph = X => X <= xb ? 2 * Math.PI * (X - x0) / lam1 : 2 * Math.PI * (xb - x0) / lam1 + 2 * Math.PI * (X - xb) / lam2;
        const y = X => ym - Ay * Math.sin(w * t - ph(X));
        g.strokeStyle = C.bl; g.lineWidth = 2.5; g.beginPath(); for (let X = x0; X <= x1; X += 2) { X === x0 ? g.moveTo(X, y(X)) : g.lineTo(X, y(X)); } g.stroke();
        // cresta que avanza
        let found = null; for (let X = x0; X <= x1; X += 1) { if (Math.abs(((w * t - ph(X)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI / 2) < 0.05) { found = X; break; } }
        if (found) { circle(g, found, y(found), 5, C.gr); txt(g, 'cresta → v', found + 8, y(found) - 12, C.gr, 'bold', 'left', 10); }
        const XP = x0 + xp * (x1 - x0); const vy = -Ay * w * Math.cos(w * t - ph(XP));
        circle(g, XP, y(XP), 6, C.rd); line(g, XP, ym - Ay - 6, XP, ym + Ay + 6, C.rd, 1, [3, 3]);
        if (Math.abs(vy) > 3) arrow(g, XP + 10, y(XP), XP + 10, y(XP) + Math.sign(vy) * Math.min(36, Math.abs(vy) / (Ay * w) * 36), C.rd, 2);
        // marcas de λ
        line(g, x0, 168, x0 + lam1, 168, C.pu, 2); txt(g, 'λ' + (modo === 'medios' ? '₁' : ''), x0 + lam1 / 2, 178, C.pu, 'bold', 'center');
        if (modo === 'medios') { line(g, xb, 168, xb + lam2, 168, C.pu, 2); txt(g, 'λ₂ = λ₁/2', xb + lam2 / 2 + 22, 178, C.pu, 'bold', 'center'); }
        S.ro.innerHTML = modo === 'medios' ? `Misma <b>f</b> en los dos medios · λ<sub>2</sub> = λ<sub>1</sub>/2 ⇒ <b>v<sub>2</sub> = v<sub>1</sub>/2</b> (v = λf)<br>Misma A y misma f ⇒ misma <b>v<sub>osc,máx</sub> = Aω</b> en los dos medios.` : (p.ro || 'Velocidad de propagación v = ω/k (la onda avanza). Velocidad de oscilación v<sub>y</sub> = ∂y/∂t (cada punto sube y baja), máxima Aω.');
      } else {
        const k = p.k || 10 * Math.PI, w = p.w || 200 * Math.PI, A2 = p.A2 || 0.01, f = p.forma || 'sin', L = p.L || 0.6;
        const tv = t * 0.5 * (2 * Math.PI) / (w / (2 * Math.PI)) * (w / (2 * Math.PI)) / (2 * Math.PI) * 2 * Math.PI; // 0,5 oscilaciones por segundo
        const ph = 2 * Math.PI * 0.5 * t;
        const sp = X => f === 'sin' ? Math.sin(k * X) : Math.cos(k * X);
        const tm = f === 'sin' ? Math.cos(ph) : Math.sin(ph);
        const px = X => x0 + (X / L) * (x1 - x0);
        g.strokeStyle = '#c7d2fe'; g.lineWidth = 1.2; g.setLineDash([4, 3]);
        [1, -1].forEach(s => { g.beginPath(); for (let i = 0; i <= 200; i++) { const X = L * i / 200, yy = ym - s * Ay * sp(X); i ? g.lineTo(px(X), yy) : g.moveTo(px(X), yy); } g.stroke(); });
        g.setLineDash([]);
        if (comp) {
          // y = A sen(kx − ωt) + A sen(kx + ωt)  (o con cos)
          [[C.or, -1], [C.gr, 1]].forEach(([col, s]) => { g.strokeStyle = col; g.globalAlpha = 0.6; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= 200; i++) { const X = L * i / 200; const yy = ym - Ay / 2 * (f === 'sin' ? Math.sin(k * X + s * ph) : Math.sin(ph + s * k * X)); i ? g.lineTo(px(X), yy) : g.moveTo(px(X), yy); } g.stroke(); g.globalAlpha = 1; });
        }
        g.strokeStyle = C.bl; g.lineWidth = 2.8; g.beginPath(); for (let i = 0; i <= 200; i++) { const X = L * i / 200, yy = ym - Ay * sp(X) * tm; i ? g.lineTo(px(X), yy) : g.moveTo(px(X), yy); } g.stroke();
        const lam = 2 * Math.PI / k;
        for (let X = 0; X <= L + 1e-9; X += lam / 4) { const v = sp(X); if (Math.abs(v) < 1e-6) { circle(g, px(X), ym, 4, '#fff', C.pu, 2); } }
        txt(g, 'nodos ○', x1, 16, C.pu, 'bold', 'right', 10);
        const XP = xp; const amp = Math.abs(sp(XP)) < 1e-3 ? 0 : A2 * sp(XP), vyMax = amp * w;
        line(g, px(XP), ym - Ay - 8, px(XP), ym + Ay + 8, C.rd, 1, [3, 3]); circle(g, px(XP), ym - Ay * sp(XP) * tm, 6, C.rd);
        for (let X = 0; X <= L + 1e-9; X += L / 6) txt(g, nf(X * 100, 0) + (X === 0 ? ' cm' : ''), px(X), 172, C.gy, '', 'center', 9);
        S.ro.innerHTML = `λ = 2π/k = ${nf(lam * 100, 1)} cm · v = ω/k = ${nf(w / k, 1)} m/s · amplitud en x: A(x) = ${nf(Math.abs(amp) * 100, 3)} cm<br>Punto x = <b>${nf(XP * 100, 1)} cm</b>: v<sub>y,máx</sub> = A(x)·ω = ${nf(Math.abs(vyMax), 3)} m/s` + (Math.abs(sp(XP)) < 0.02 ? ' → <b>es un nodo: siempre en reposo</b>' : '') + `<br><span style="color:#64748b">Animación a cámara lenta.</span>`;
      }
    }
    S.buttons([['⏯', () => { run = !run; }]].concat(modo === 'estacionaria' ? [['Ver las dos ondas viajeras', b => { comp = !comp; b.classList.toggle('on', comp); }]] : []));
    if (modo === 'estacionaria') S.slider('Posición del punto rojo', 0, p.L || 0.6, 0.005, xp, v => nf(v * 100, 1) + ' cm', v => { xp = v; });
    else S.slider('Posición del punto rojo', 0, 1, 0.01, xp, v => nf(v * 100, 0) + ' %', v => { xp = v; });
    loop(S, step);
  }

  /* =====================================================================
     8. ÓPTICA GEOMÉTRICA: lentes delgadas y espejos (normas DIN)
     p: {tipo:'convergente'|'divergente'|'convexo'|'concavo', f, s, y, u:'cm'|'m'|'mm', smin, smax}
  ===================================================================== */
  function optica(box, p) {
    const tipo = p.tipo, espejo = tipo === 'convexo' || tipo === 'concavo', u = p.u || 'cm';
    const S = base(box, 250, p.titulo || ('Trazado de rayos: ' + ({ convergente: 'lente convergente', divergente: 'lente divergente', convexo: 'espejo convexo', concavo: 'espejo cóncavo' })[tipo]), 'Mueve el objeto con el deslizador y observa cómo cambian la posición, el tamaño y la naturaleza de la imagen.');
    let f = p.f, s = p.s, y = p.y || 1;
    const fa = Math.abs(f);
    function img() {
      let sp, A;
      if (espejo) { sp = 1 / (1 / f - 1 / s); A = -sp / s; } else { sp = 1 / (1 / f + 1 / s); A = sp / s; }
      return { sp, yp: A * y, A };
    }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      const { sp, yp, A } = img();
      const spc = isFinite(sp) ? Math.max(-8 * fa, Math.min(8 * fa, sp)) : 8 * fa;
      const xmin = Math.min(s, espejo ? -0.3 * fa : spc, -1.3 * fa), xmax = Math.max(espejo ? Math.max(2.15 * f, spc, 0.3 * fa) : spc, 1.3 * fa, 0.2 * fa);
      const sc = (W - 60) / (xmax - xmin), xL = 30 - xmin * sc;
      const ym = 118, ys = 92 / Math.max(y, Math.min(Math.abs(yp), 10 * y));
      const X = v => xL + v * sc, Y = v => ym - v * ys;
      line(g, 6, ym, W - 6, ym, C.gy, 1.2);
      if (espejo) {
        const hh = 95, sag = 12, c = tipo === 'convexo' ? 1 : -1, xe = k => xL + c * sag * (k / hh) ** 2;
        g.strokeStyle = '#0f172a'; g.lineWidth = 3; g.beginPath();
        for (let k = -hh; k <= hh; k += 5) k === -hh ? g.moveTo(xe(k), ym + k) : g.lineTo(xe(k), ym + k); g.stroke();
        for (let k = -hh + 6; k <= hh; k += 10) line(g, xe(k) + 2, ym + k, xe(k) + 9, ym + k - 6, '#94a3b8', 1);
      } else {
        line(g, xL, ym - 100, xL, ym + 100, '#0f172a', 2.4);
        const conv = tipo === 'convergente';
        [[ym - 100, 1], [ym + 100, -1]].forEach(([yy, s2]) => {
          g.strokeStyle = '#0f172a'; g.lineWidth = 2.4; g.beginPath();
          if (conv) { g.moveTo(xL - 7, yy + s2 * 9); g.lineTo(xL, yy); g.lineTo(xL + 7, yy + s2 * 9); }
          else { g.moveTo(xL - 7, yy - s2 * 9 + s2 * 9 - s2 * 0); g.moveTo(xL - 7, yy - s2 * 8); g.lineTo(xL, yy); g.lineTo(xL + 7, yy - s2 * 8); }
          g.stroke();
        });
      }
      // focos
      const F1 = espejo ? f : f, F2 = espejo ? null : -f;
      circle(g, X(F1), ym, 3.5, C.tx); txt(g, espejo ? 'F' : "F'", X(F1), ym + 14, C.tx, 'bold', 'center', 11);
      if (!espejo) { circle(g, X(F2), ym, 3.5, C.tx); txt(g, 'F', X(F2), ym + 14, C.tx, 'bold', 'center', 11); }
      if (espejo) { circle(g, X(2 * f), ym, 3.5, C.tx); txt(g, 'C', X(2 * f), ym + 14, C.tx, 'bold', 'center', 11); }
      // objeto
      arrow(g, X(s), ym, X(s), Y(y), C.rd, 3, 'objeto', 0, -10);
      // rayos
      const ext = (x0, y0, dx, dy, col, dash) => { const L = 2000; line(g, x0, y0, x0 + dx * L, y0 + dy * L, col, 1.8, dash); };
      const seg = (x0, y0, x1, y1, col, dash) => line(g, x0, y0, x1, y1, col, 1.8, dash);
      const ox = X(s), oy = Y(y), ix = X(sp), iy = Y(yp), real = espejo ? sp < 0 : sp > 0;
      const colors = [C.or, C.bl, C.pu];
      if (!espejo) {
        // 1: paralelo -> por F' (o como si viniera de F')
        seg(ox, oy, xL, oy, colors[0]);
        const dx1 = X(f) - xL, dy1 = ym - oy, n1 = Math.hypot(dx1, dy1);
        if (f > 0) ext(xL, oy, dx1 / n1, dy1 / n1, colors[0]); else { ext(xL, oy, -dx1 / n1, -dy1 / n1, colors[0]); seg(xL, oy, X(f), ym, colors[0], [4, 4]); }
        // 2: por el centro óptico
        const dx2 = xL - ox, dy2 = ym - oy, n2 = Math.hypot(dx2, dy2); seg(ox, oy, xL, ym, colors[1]); ext(xL, ym, dx2 / n2, dy2 / n2, colors[1]);
        // 3: hacia/por F -> sale paralelo
        const Fx = X(-f), dx3 = Fx - ox, dy3 = ym - oy; const tt = (xL - ox) / dx3; const yh = oy + dy3 * tt;
        if (Math.abs(tt) < 50 && Math.abs(yh - ym) < 140) { seg(ox, oy, xL, yh, colors[2]); ext(xL, yh, 1, 0, colors[2]); if (!real) seg(xL, yh, ix, yh, colors[2], [4, 4]); }
        if (!real) { seg(xL, ym, ix, iy, colors[1], [4, 4]); if (f > 0) seg(xL, oy, ix, iy, colors[0], [4, 4]); }
      } else {
        // espejo: 1 paralelo -> reflejado por F (cóncavo) o como si viniera de F (convexo)
        seg(ox, oy, xL, oy, colors[0]);
        const dx1 = X(f) - xL, dy1 = ym - oy, n1 = Math.hypot(dx1, dy1);
        if (tipo === 'concavo') ext(xL, oy, dx1 / n1, dy1 / n1, colors[0]); else { ext(xL, oy, -dx1 / n1, -dy1 / n1, colors[0]); seg(xL, oy, X(f), ym, colors[0], [4, 4]); }
        // 2: al vértice -> simétrico
        const dx2 = xL - ox, dy2 = ym - oy, n2 = Math.hypot(dx2, dy2); seg(ox, oy, xL, ym, colors[1]); ext(xL, ym, -dx2 / n2, dy2 / n2, colors[1]);
        if (!real) seg(xL, ym, ix, iy, colors[1], [4, 4]);
        // 3: hacia C -> vuelve sobre sí mismo
        const Cx = X(2 * f), dx3 = Cx - ox, dy3 = ym - oy, n3 = Math.hypot(dx3, dy3), tt = (xL - ox) / dx3, yh = oy + dy3 * tt;
        seg(ox, oy, xL, yh, colors[2]); if (!real) seg(xL, yh, Cx, ym, colors[2], [4, 4]);
      }
      if (isFinite(sp) && Math.abs(sp) < 40 * fa) { g.globalAlpha = real ? 1 : 0.85; arrow(g, ix, ym, ix, iy, C.gr, 3, 'imagen', 0, yp > 0 ? -10 : 12); g.globalAlpha = 1; if (!real) line(g, ix, ym, ix, iy, '#fff', 1, [3, 3]); }
      const k = u === 'mm' ? 1 : 1;
      const nat = !isFinite(sp) ? 'no se forma imagen (objeto en el foco)' : `${real ? 'real' : 'virtual'}, ${A > 0 ? 'derecha' : 'invertida'} y ${Math.abs(A) > 1 ? 'mayor' : 'menor'} que el objeto`;
      S.ro.innerHTML = `s = ${nf(s, 2)} ${u} · ${espejo ? 'f' : "f'"} = ${nf(f, 2)} ${u} → <b>s'</b> = ${nf(sp, 2)} ${u} · <b>aumento</b> = ${nf(A, 2)} · y' = ${nf(yp, 3)} ${p.uy || u}<br>Imagen <b>${nat}</b>.`;
    }
    const smin = p.smin || -4 * fa, smax = p.smax || -0.15 * fa;
    S.slider('Posición del objeto s', smin, smax, 'any', s, v => nf(v, 2) + ' ' + u, v => { s = v; draw(); });
    S.buttons([['↺ Datos del enunciado', () => { s = p.s; S.ct.querySelector('input').value = s; S.ct.querySelector('input').dispatchEvent(new Event('input')); draw(); }]]);
    draw();
  }

  /* =====================================================================
     9. REFRACCIÓN Y ÁNGULO LÍMITE
     p: {n1, n2}
  ===================================================================== */
  function snell(box, p) {
    const S = base(box, 240, p.titulo || 'Ley de Snell y reflexión total', 'Aumenta el ángulo de incidencia. Si n₁ > n₂, al superar el ángulo límite la luz ya no pasa al segundo medio.');
    let n1 = p.n1 || 1.5, n2 = p.n2 || 1.0, a1 = p.a1 || 30;
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      const cx = W / 2, cy = 112;
      g.fillStyle = '#dbeafe'; g.fillRect(0, 0, W, cy); g.fillStyle = '#f8fafc'; g.fillRect(0, cy, W, H - cy);
      txt(g, 'medio 1 · n₁ = ' + nf(n1, 2), 8, 14, C.bl, 'bold'); txt(g, 'medio 2 · n₂ = ' + nf(n2, 2), 8, cy + 14, C.gy, 'bold');
      line(g, 0, cy, W, cy, C.gy, 1.5); line(g, cx, 10, cx, H - 10, C.gy, 1, [4, 3]);
      const r = 100, a = a1 * Math.PI / 180;
      line(g, cx - r * Math.sin(a), cy - r * Math.cos(a), cx, cy, C.or, 3);
      const sn = n1 / n2 * Math.sin(a), tot = sn > 1;
      g.globalAlpha = tot ? 1 : 0.35; arrow(g, cx, cy, cx + r * Math.sin(a), cy - r * Math.cos(a), C.or, tot ? 3 : 2); g.globalAlpha = 1;
      if (!tot) { const a2 = Math.asin(sn); arrow(g, cx, cy, cx + r * Math.sin(a2), cy + r * Math.cos(a2), C.rd, 3); txt(g, 'θ₂ = ' + nf(a2 * 180 / Math.PI, 1) + '°', cx + 10, cy + 60, C.rd, 'bold'); }
      else txt(g, '¡Reflexión total!', cx + 12, cy + 40, C.rd, 'bold', 'left', 14);
      txt(g, 'θ₁ = ' + a1 + '°', cx - 64, cy - 60, C.or, 'bold');
      const lim = n1 > n2 ? Math.asin(n2 / n1) * 180 / Math.PI : null;
      S.ro.innerHTML = `v<sub>1</sub> = c/n<sub>1</sub> = ${nf(3e8 / n1)} m/s · v<sub>2</sub> = c/n<sub>2</sub> = ${nf(3e8 / n2)} m/s<br>` + (lim !== null ? `Ángulo límite: sen θ<sub>L</sub> = n<sub>2</sub>/n<sub>1</sub> ⇒ <b>θ<sub>L</sub> = ${nf(lim, 1)}°</b>` : 'n<sub>1</sub> &lt; n<sub>2</sub>: <b>no existe ángulo límite</b> (el rayo se acerca a la normal).');
    }
    S.slider('Ángulo de incidencia θ₁', 0, 89, 1, a1, v => v + '°', v => { a1 = v; draw(); });
    S.slider('n₁', 1, 2.5, 0.01, n1, v => nf(v, 2), v => { n1 = v; draw(); });
    S.slider('n₂', 1, 2.5, 0.01, n2, v => nf(v, 2), v => { n2 = v; draw(); });
    draw();
  }

  /* =====================================================================
     10. EFECTO FOTOELÉCTRICO
     p: {W (eV), metal, f (Hz)}
  ===================================================================== */
  function foto(box, p) {
    const S = base(box, 210, p.titulo || 'Efecto fotoeléctrico', 'La frecuencia decide si se arrancan electrones y con qué energía; la intensidad sólo cambia cuántos.');
    const h = 6.63e-34, e = 1.6e-19, me = 9.1e-31, W0 = p.W || 4.7;
    let f = p.f || 1.2e15, I = 5, ph = [], el2 = [], acc = 0;
    function color(f) {
      const lam = 3e8 / f * 1e9;
      if (lam < 380) return '#7c3aed'; if (lam > 750) return '#7f1d1d';
      const hue = 270 - (lam - 380) / (750 - 380) * 270; return `hsl(${hue},85%,50%)`;
    }
    function step(dt) {
      acc += dt * I * 3;
      while (acc > 1) { acc -= 1; ph.push({ x: 40, y: 40 + Math.random() * 90, t: 0 }); }
      const Ef = h * f / e, Ec = Ef - W0, vrel = Ec > 0 ? Math.sqrt(Ec / 20) : 0;
      const xp = Math.round(S.W * 0.5);
      ph.forEach(q => { q.x += dt * 150; q.y += dt * 34; });
      ph = ph.filter(q => { if (q.x >= xp - 4) { if (Ec > 0) el2.push({ x: xp, y: q.y + 10, v: 30 + 220 * vrel }); return false; } return true; });
      el2.forEach(q => { q.x -= dt * q.v; q.y -= dt * q.v * 0.3; }); el2 = el2.filter(q => q.x > 0 && q.y > 0);
      draw();
    }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      // lámpara
      g.fillStyle = '#fde68a'; g.beginPath(); g.arc(28, 50, 18, 0, 2 * Math.PI); g.fill(); txt(g, '💡', 28, 50, C.tx, '', 'center', 16);
      // placa metálica
      const xp = Math.round(W * 0.5); g.fillStyle = '#94a3b8'; g.fillRect(xp, 30, 12, 130); txt(g, p.metal || 'metal', xp + 6, 172, C.gy, 'bold', 'center', 11);
      const col = color(f);
      ph.forEach(q => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 14; i++) { const xx = q.x - i, yy = q.y - i * 0.22 + 3 * Math.sin(i * 1.2); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); });
      el2.forEach(q => { circle(g, q.x, q.y, 4, C.bl); txt(g, '−', q.x, q.y + 1, '#fff', 'bold', 'center', 8); });
      // gráfica Ec,máx frente a f
      const gx = Math.round(W * 0.62), gy = 30, gw = W - gx - 8, gh = 130, fmax = Math.max(2 * W0 * e / h, f * 1.2), Emax = h * fmax / e - W0;
      line(g, gx, gy + gh, gx + gw, gy + gh, C.gy, 1.2); line(g, gx, gy, gx, gy + gh, C.gy, 1.2);
      const f0 = W0 * e / h, X = ff => gx + gw * ff / fmax, Y = E => gy + gh - gh * E / Emax;
      line(g, X(f0), Y(0), X(fmax), Y(Emax), C.pu, 2); circle(g, X(f0), Y(0), 3.5, C.pu); txt(g, 'f₀', X(f0), Y(0) + 10, C.pu, 'bold', 'center', 10);
      const Ec = h * f / e - W0; circle(g, X(f), Y(Math.max(0, Ec)), 5, Ec > 0 ? C.gr : C.rd);
      txt(g, 'E_c,máx', gx + 2, gy - 8, C.gy, '', 'left', 10); txt(g, 'f', gx + gw, gy + gh + 10, C.gy, '', 'right', 10);
      const v = Ec > 0 ? Math.sqrt(2 * Ec * e / me) : 0;
      S.ro.innerHTML = `E<sub>fotón</sub> = hf = <b>${nf(h * f / e, 2)} eV</b> · W<sub>ext</sub> = ${nf(W0, 2)} eV (f<sub>0</sub> = ${nf(f0)} Hz)<br>` +
        (Ec > 0 ? `<b>Hay emisión</b>: E<sub>c,máx</sub> = hf − W = ${nf(Ec, 2)} eV · v<sub>máx</sub> = ${nf(v)} m/s` : `<b>No hay emisión</b>: hf &lt; W<sub>ext</sub>, por mucha intensidad que tenga la luz.`);
    }
    const lf = Math.log10(f);
    S.slider('Frecuencia f', 14, 16, 0.005, lf, v => nf(Math.pow(10, v)) + ' Hz', v => { f = Math.pow(10, v); });
    S.slider('Intensidad (fotones por segundo)', 1, 10, 1, I, v => '×' + v, v => { I = v; });
    if (p.presets) S.buttons(p.presets.map(([lab, ff]) => [lab, () => { f = ff; const inp = S.ct.querySelector('input'); inp.value = Math.log10(ff); inp.dispatchEvent(new Event('input')); }]));
    loop(S, step);
  }

  /* =====================================================================
     11. DESINTEGRACIÓN RADIACTIVA
     p: {T (periodo), u:'días', N0, m0, mat (masa de un núcleo en kg)}
  ===================================================================== */
  function decay(box, p) {
    const S = base(box, 200, p.titulo || 'Desintegración radiactiva', 'Cada punto es un núcleo. Tras cada periodo de semidesintegración queda, en promedio, la mitad.');
    const T = p.T || 8.02, lam = Math.LN2 / T, n = 400, ths = Array.from({ length: n }, () => -Math.log(Math.random()) / lam);
    let t = 0, run = false;
    let sl;
    function step(dt) { if (run) { t += dt * T / 2; if (t > 6 * T) { t = 6 * T; run = false; } if (sl) { sl.value = t; sl.previousSibling.lastChild.textContent = nf(t, 1) + ' ' + (p.u || 'días'); } } draw(); }
    function draw() {
      const { g, W, H } = S; g.clearRect(0, 0, W, H);
      const cols = 20, cs = Math.min(7.4, (W * 0.46) / 20);
      for (let i = 0; i < n; i++) { const x = 12 + (i % cols) * cs, y = 14 + Math.floor(i / cols) * cs; circle(g, x, y, 2.6, ths[i] > t ? C.am : '#e2e8f0'); }
      const gx = Math.round(W * 0.54), gy = 14, gw = W - gx - 10, gh = 140;
      line(g, gx, gy + gh, gx + gw, gy + gh, C.gy, 1.2); line(g, gx, gy, gx, gy + gh, C.gy, 1.2);
      g.strokeStyle = C.am; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 100; i++) { const tt = 6 * T * i / 100, yy = gy + gh - gh * Math.exp(-lam * tt); i ? g.lineTo(gx + gw * i / 100, yy) : g.moveTo(gx, yy); } g.stroke();
      for (let k = 1; k <= 6; k++) { const xx = gx + gw * k / 6; line(g, xx, gy + gh, xx, gy + gh + 4, C.gy, 1); txt(g, k + 'T', xx, gy + gh + 12, C.gy, '', 'center', 9); }
      txt(g, '½', gx - 8, gy + gh / 2, C.gy, '', 'right', 10); line(g, gx, gy + gh / 2, gx + gw / 6, gy + gh / 2, C.lt, 1, [3, 3]); line(g, gx + gw / 6, gy + gh / 2, gx + gw / 6, gy + gh, C.lt, 1, [3, 3]);
      const xn = gx + gw * t / (6 * T); circle(g, xn, gy + gh - gh * Math.exp(-lam * t), 5, C.rd);
      txt(g, 'N/N₀', gx + 4, gy + 6, C.am, 'bold', 'left', 10);
      const frac = Math.exp(-lam * t), quedan = ths.filter(x => x > t).length;
      const N0 = p.N0, lamS = Math.LN2 / (T * (p.seg || 86400));
      S.ro.innerHTML = `t = <b>${nf(t, 2)} ${p.u || 'días'}</b> (${nf(t / T, 2)} periodos) · N/N<sub>0</sub> = e<sup>−λt</sup> = ${nf(frac, 3)} · en el dibujo quedan ${quedan} de ${n}` +
        (N0 ? `<br>N = ${nf(N0 * frac)} núcleos · m = ${nf((p.m0 || 0) * frac, 2)} g · <b>A</b> = λN = ${nf(lamS * N0 * frac)} Bq` : '');
    }
    S.buttons([['▶ Iniciar', () => { if (t >= 6 * T) t = 0; run = true; }], ['⏸', () => { run = false; }], ['↺', () => { t = 0; run = false; }]]);
    sl = S.slider('Tiempo transcurrido', 0, 6 * T, T / 100, 0, v => nf(v, 1) + ' ' + (p.u || 'días'), v => { t = v; run = false; });
    if (p.marca) S.buttons([[p.marca[0], () => { t = p.marca[1]; run = false; sl.value = t; sl.dispatchEvent(new Event('input')); }]]);
    loop(S, step);
  }

  const REG = { rampa, orbita, campos, induccion, particula, mas, onda, optica, snell, foto, decay };
  window.SIMS = function () {
    css();
    document.querySelectorAll('.sim:not([data-ok])').forEach(box => {
      box.dataset.ok = 1;
      let P = {}; try { P = JSON.parse(box.dataset.p || '{}'); } catch (e) { }
      const fn = REG[box.dataset.sim];
      if (!fn) return;
      try { fn(box, P); } catch (e) { console.error('sim', box.dataset.sim, e); box.innerHTML = '<div class="hint">No se ha podido cargar el modelo interactivo.</div>'; }
    });
  };
})();
