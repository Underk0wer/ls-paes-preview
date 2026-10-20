/* Humo procedural para los fondos por capas (.bg-stage).
   Cada <canvas class="bg-humo"> cubre el lienzo de su escenario (1920×1080 en desktop,
   1080×1920 en el index mobile) y se dibuja a media resolución (el humo es difuso).
   Todas las coordenadas y tamaños de las opciones van en px de ese lienzo. Mientras el
   canvas está oculto (su escenario con display: none) no se dibuja.

   crearHumo(canvas, {
     ancho: 1920,                       // ancho del lienzo del escenario
     cantidad: 46,                      // bocanadas simultáneas
     zonas: [[xMin, xMax, peso], ...],  // dónde nacen (en horizontal) y con qué probabilidad
     y: [min, max],                     // altura donde nacen
     subida: [min, max],                // velocidad de subida (px/s)
     deriva: 14,                        // velocidad lateral máxima (px/s, a cada lado)
     tamano: [min, max], crece: [min, max], vida: [min, max] (s),
     opacidad: [min, max],
     techo: [yTransparente, yOpaco]     // opcional: el humo se desvanece hacia arriba
   }) */
(function () {
  const hash = (x, y, s) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy, s), b = hash(ix + 1, iy, s);
    const c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
  const fbm = (x, y, s) => {
    let v = 0, amp = 0.5;
    for (let o = 0; o < 5; o++) { v += amp * noise(x, y, s + o); x *= 2; y *= 2; amp *= 0.5; }
    return v;
  };

  // Bocanada: ruido fbm distorsionado (textura de humo) recortado por un degradé radial
  const makePuff = (size, seed) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size, ny = y / size;
        const r = Math.hypot(nx - 0.5, ny - 0.5) * 2;
        if (r >= 1) continue;
        const w = fbm(nx * 3, ny * 3, seed + 10);
        const n = fbm(nx * 3 + w * 1.8, ny * 3 + w * 1.8, seed);
        const a = Math.min(1, Math.max(0, (n - 0.28) * 2.6)) * Math.pow(1 - r, 1.4);
        const i = (y * size + x) * 4;
        img.data[i] = 242; img.data[i + 1] = 238; img.data[i + 2] = 232;
        img.data[i + 3] = a * 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  };
  let puffs = null;   // texturas compartidas por todos los canvas de la página
  const getPuffs = () => puffs || (puffs = [11, 23, 37, 51].map(seed => makePuff(192, seed)));

  const rand = ([a, b]) => a + Math.random() * (b - a);
  const smooth = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };

  window.crearHumo = function (canvas, o) {
    const ctx = canvas.getContext('2d');
    const SCALE = canvas.width / (o.ancho || 1920);
    const textures = getPuffs();
    const pesoTotal = o.zonas.reduce((s, z) => s + z[2], 0);

    let techo = null;
    if (o.techo) {
      techo = ctx.createLinearGradient(0, o.techo[0] * SCALE, 0, o.techo[1] * SCALE);
      techo.addColorStop(0, 'rgba(0,0,0,0)');
      techo.addColorStop(1, 'rgba(0,0,0,1)');
    }

    const advance = (p, dt) => {
      p.age += dt;
      p.x += (p.vx + Math.sin(p.age * 0.4 + p.phase) * 8) * dt;
      p.y += p.vy * dt;
      p.size += p.grow * dt;
      p.rot += p.spin * dt;
    };
    const spawn = (p, prewarm) => {
      let r = Math.random() * pesoTotal, z = o.zonas[o.zonas.length - 1];
      for (const zz of o.zonas) { r -= zz[2]; if (r < 0) { z = zz; break; } }
      p.x = rand([z[0], z[1]]);
      p.y = rand(o.y);
      p.vx = (Math.random() - 0.5) * o.deriva;
      p.vy = -rand(o.subida);
      p.size = rand(o.tamano);
      p.grow = rand(o.crece);
      p.rot = Math.random() * Math.PI * 2;
      p.spin = (Math.random() - 0.5) * 0.12;
      p.phase = Math.random() * Math.PI * 2;
      p.life = rand(o.vida);
      p.alpha = rand(o.opacidad);
      p.puff = textures[(Math.random() * textures.length) | 0];
      p.age = 0;
      if (prewarm) advance(p, Math.random() * p.life);
    };

    const particles = Array.from({ length: o.cantidad }, () => { const p = {}; spawn(p, true); return p; });
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!canvas.getClientRects().length) { requestAnimationFrame(frame); return; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        advance(p, dt);
        if (p.age >= p.life) spawn(p, false);
        const t = p.age / p.life;
        ctx.globalAlpha = p.alpha * smooth(0, 0.15, t) * (1 - smooth(0.65, 1, t));
        const cos = Math.cos(p.rot) * SCALE, sin = Math.sin(p.rot) * SCALE;
        ctx.setTransform(cos, sin, -sin, cos, p.x * SCALE, p.y * SCALE);
        ctx.drawImage(p.puff, -p.size / 2, -p.size / 2, p.size, p.size);
      }
      if (techo) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = techo;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
})();
