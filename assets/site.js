(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrance: each element rises once as it enters. Content is visible without script.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '100000px 0px -8% 0px', threshold: 0 });
  document.querySelectorAll('.rv, .anno, .bars').forEach((el) => io.observe(el));
  // Stagger siblings inside a group
  document.querySelectorAll('[data-stagger]').forEach((g) => {
    [...g.querySelectorAll(':scope > .rv, :scope .rv')].forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 8) * 70}ms`));
  });

  // Nav hides on scroll down, returns on scroll up
  const nav = document.querySelector('.nav');
  let lastY = scrollY;
  let ticking = false;
  const stage = document.querySelector('.hero-stage .render');
  const csImg = document.querySelector('.cs-hero .panel img');
  const onScroll = () => {
    const y = scrollY;
    if (nav) {
      if (y > 120 && y > lastY + 4) nav.classList.add('hide');
      else if (y < lastY - 4 || y < 120) nav.classList.remove('hide');
    }
    if (stage && !reduce) {
      const t = Math.min(y, innerHeight);
      stage.style.transform = `translate3d(0, ${t * 0.12}px, 0) scale(${1 + t * 0.00012})`;
    }
    if (csImg && !reduce) {
      const t = Math.min(y / innerHeight, 1);
      csImg.style.transform = `scale(${1.06 - t * 0.06}) translate3d(0, ${t * 2}%, 0)`;
    }
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  nav?.addEventListener('focusin', () => nav.classList.remove('hide'));
  onScroll();

  // Work index: image preview follows the pointer
  const preview = document.querySelector('.preview');
  if (preview && matchMedia('(hover: hover)').matches) {
    const img = preview.querySelector('img');
    let px = 0, py = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (px - cx) * 0.18; cy += (py - cy) * 0.18;
      preview.style.left = `${cx}px`; preview.style.top = `${cy}px`;
      raf = Math.abs(px - cx) + Math.abs(py - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    document.querySelectorAll('.index a[data-preview]').forEach((a) => {
      a.addEventListener('pointerenter', (e) => {
        img.src = a.dataset.preview;
        px = cx = e.clientX + 200; py = cy = e.clientY;
        preview.classList.add('on');
      });
      a.addEventListener('pointermove', (e) => {
        px = e.clientX + 200; py = e.clientY;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      a.addEventListener('pointerleave', () => preview.classList.remove('on'));
    });
  }

  // Bar charts grow when seen
  document.querySelectorAll('.bars .fill').forEach((f) => {
    const target = f.dataset.v;
    if (reduce) { f.style.transform = `scaleX(${target})`; return; }
    f.style.transform = 'scaleX(0)';
    f.style.transition = 'transform 1.1s cubic-bezier(.2,.7,.1,1)';
    const p = f.closest('.bars');
    new IntersectionObserver(([e], o) => {
      if (e.isIntersecting) { f.style.transform = `scaleX(${target})`; o.disconnect(); }
    }, { threshold: 0.3 }).observe(p);
  });

  // Motion planner: A* on the coursework occupancy grid
  const pl = document.querySelector('[data-planner]');
  if (pl) planner(pl);

  function planner(root) {
    const N = 320, PX_PER_M = 16, SCALE = 2;
    const rle = root.dataset.map.split(',').map(Number);
    const base = new Uint8Array(N * N);
    let k = 0, v = 0;
    for (const run of rle) { base.fill(v, k, k + run); k += run; v ^= 1; }
    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = N * SCALE;
    const out = root.querySelector('[data-len]');
    const status = root.querySelector('[data-status]');
    const buttons = root.querySelectorAll('[data-mask]');
    const css = getComputedStyle(doc);
    const C = {
      free: css.getPropertyValue('--ground-2').trim(),
      occ: css.getPropertyValue('--ink').trim(),
      margin: '#b8bbc0',
      accent: css.getPropertyValue('--accent').trim(),
    };
    const start = { x: 160, y: N - 1 - 64 };
    let goal = { x: 288, y: N - 1 - 288 };
    let mask = 'circle';
    let cspace = dilate(mask);

    function dilate(kind) {
      const r = 8, o = new Uint8Array(N * N);
      const offs = [];
      for (let dy = -r; dy < r; dy++) for (let dx = -r; dx < r; dx++) {
        if (kind === 'circle' && (dx + 0.5) ** 2 + (dy + 0.5) ** 2 > r * r) continue;
        offs.push([dx, dy]);
      }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (x < r || y < r || x >= N - r || y >= N - r) { o[y * N + x] = 1; continue; }
        if (base[y * N + x]) { o[y * N + x] = 1; continue; }
        for (const [dx, dy] of offs) {
          if (base[(y + dy) * N + (x + dx)]) { o[y * N + x] = 1; break; }
        }
      }
      return o;
    }

    function astar(s, g) {
      const S = s.y * N + s.x, G = g.y * N + g.x;
      if (cspace[S] || cspace[G]) return null;
      const gs = new Float32Array(N * N).fill(Infinity);
      const from = new Int32Array(N * N).fill(-1);
      const closed = new Uint8Array(N * N);
      const heap = [];
      const h = (i) => { const dx = Math.abs(i % N - g.x), dy = Math.abs(((i / N) | 0) - g.y); return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy); };
      const push = (f, i) => { heap.push([f, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
      gs[S] = 0; push(h(S), S);
      const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
      while (heap.length) {
        const [, i] = pop();
        if (closed[i]) continue;
        if (i === G) break;
        closed[i] = 1;
        const x = i % N, y = (i / N) | 0;
        for (const [dx, dy, c] of D) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          const j = ny * N + nx;
          if (cspace[j] || closed[j]) continue;
          if (dx && dy && (cspace[y * N + nx] || cspace[ny * N + x])) continue;
          const t = gs[i] + c;
          if (t < gs[j]) { gs[j] = t; from[j] = i; push(t + h(j), j); }
        }
      }
      if (from[G] < 0) return null;
      const path = [];
      for (let i = G; i !== -1; i = from[i]) path.push(i);
      return { path: path.reverse(), len: gs[G] / PX_PER_M };
    }

    function draw(res) {
      const img = ctx.createImageData(N, N);
      const hex = (h) => [1, 3, 5].map((p) => parseInt(h.slice(p, p + 2), 16));
      const F = hex(C.free), O = hex(C.occ), M = hex(C.margin);
      for (let i = 0; i < N * N; i++) {
        const c = base[i] ? O : cspace[i] ? M : F;
        img.data.set([c[0], c[1], c[2], 255], i * 4);
      }
      const off = new OffscreenCanvasLike(N);
      off.ctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off.el, 0, 0, N * SCALE, N * SCALE);
      if (res) {
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        res.path.forEach((i, n) => { const x = (i % N + 0.5) * SCALE, y = (((i / N) | 0) + 0.5) * SCALE; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.strokeStyle = C.occ; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = C.accent; ctx.lineWidth = 5; ctx.stroke();
      }
      dot(start, C.occ, '#ffffff'); dot(goal, C.accent, C.occ);
    }
    function dot(p, fill, stroke) {
      ctx.beginPath(); ctx.arc((p.x + 0.5) * SCALE, (p.y + 0.5) * SCALE, 9, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke();
    }
    function OffscreenCanvasLike(n) { const el = document.createElement('canvas'); el.width = el.height = n; return { el, ctx: el.getContext('2d') }; }

    const world = (p) => `(${(p.x / PX_PER_M - 10).toFixed(1)}, ${((N - 1 - p.y) / PX_PER_M - 10).toFixed(1)}) m`;
    function run() {
      const res = astar(start, goal);
      draw(res);
      if (res) { out.textContent = res.len.toFixed(2); status.textContent = `Goal ${world(goal)}. Path found.`; }
      else { out.textContent = '—'; status.textContent = `Goal ${world(goal)} is inside an obstacle margin. Pick open floor.`; }
    }
    function setGoalFromEvent(e) {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * N), y = Math.floor(((e.clientY - r.top) / r.height) * N);
      goal = { x: Math.max(0, Math.min(N - 1, x)), y: Math.max(0, Math.min(N - 1, y)) };
      run();
    }
    let dragging = false;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); setGoalFromEvent(e); });
    canvas.addEventListener('pointermove', (e) => { if (dragging) setGoalFromEvent(e); });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 16 : 4;
      const m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!m) return;
      e.preventDefault();
      goal = { x: Math.max(0, Math.min(N - 1, goal.x + m[0])), y: Math.max(0, Math.min(N - 1, goal.y + m[1])) };
      run();
    });
    buttons.forEach((b) => b.addEventListener('click', () => {
      mask = b.dataset.mask;
      buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      cspace = dilate(mask);
      run();
    }));
    root.querySelector('[data-reset]')?.addEventListener('click', () => { goal = { x: 288, y: N - 1 - 288 }; run(); });
    run();
  }
})();
