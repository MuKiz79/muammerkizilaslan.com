/* A neural cosmos: branching cells, connected signals and a continuous handoff.
   Procedural geometry is seeded once; the same scene replays without loading media. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2,
    clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (a, b, v) => {
    const p = clamp((v - a) / (b - a));
    return p * p * (3 - 2 * p);
  };
  const mix = (a, b, p) => a + (b - a) * p;
  const palette = [
    [242, 162, 109],
    [111, 182, 223],
    [174, 159, 223],
  ];
  const cache = new Map();
  // The second thought travels through the same graph, leaving silver behind it.
  const silverStart = 2.15,
    silverTravel = 0.5,
    silverSettle = 0.2;
  function silverAt(arrival) {
    return silverStart + (arrival - 0.48) * silverTravel;
  }
  function colorAt(color, t, at) {
    const p = ease(at, at + silverSettle, t),
      luminance = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
    return color.map((c) => Math.round(mix(c, luminance, p)));
  }
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function lerp3(a, b, t) {
    return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) };
  }
  function cubic(a, b, c, d, t) {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
      z: u * u * u * a.z + 3 * u * u * t * b.z + 3 * u * t * t * c.z + t * t * t * d.z,
    };
  }
  function universe(count) {
    if (cache.has(count)) return cache.get(count);
    const rand = random(17341 + count),
      cells = [],
      edges = [],
      branches = [],
      dust = [],
      stars = [];
    // An irregular volume, with a recognisable central cell; never concentric wire rings.
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996323,
        r = i === 0 ? 0 : 0.28 + Math.sqrt(i / (count - 1)) * 1.05;
      cells.push({
        x: Math.cos(a) * r * 1.1,
        y: Math.sin(a) * r * 0.77,
        z: i === 0 ? 0.55 : (rand() - 0.5) * 1.5,
        index: i,
        color: i === 0 ? 0 : i % 5 === 0 ? 2 : i % 3 === 0 ? 0 : 1,
        phase: rand() * TAU,
        size: i === 0 ? 2.1 : 0.7 + rand() * 0.65,
      });
    }
    const pairs = new Set(),
      neighbors = cells.map(() => []);
    function connect(a, b) {
      if (a > b) [a, b] = [b, a];
      const key = a + ':' + b;
      if (pairs.has(key)) return;
      pairs.add(key);
      edges.push({
        a,
        b,
        length: Math.hypot(
          cells[a].x - cells[b].x,
          cells[a].y - cells[b].y,
          cells[a].z - cells[b].z,
        ),
      });
      neighbors[a].push(b);
      neighbors[b].push(a);
    }
    // Every cell reaches an earlier cell, then two spatial neighbours: no isolated islands.
    for (let i = 1; i < count; i++) {
      const near = cells
        .map((n, j) => ({ j, d: Math.hypot(n.x - cells[i].x, n.y - cells[i].y, n.z - cells[i].z) }))
        .filter((n) => n.j !== i)
        .sort((a, b) => a.d - b.d);
      connect(i, near.find((n) => n.j < i).j);
      near.slice(0, 2).forEach((n) => connect(i, n.j));
    }
    const arrival = cells.map(() => Infinity),
      parent = cells.map(() => -1),
      visited = new Set();
    arrival[0] = 0;
    for (let k = 0; k < count; k++) {
      let at = -1;
      for (let i = 0; i < count; i++)
        if (!visited.has(i) && (at < 0 || arrival[i] < arrival[at])) at = i;
      visited.add(at);
      for (const n of neighbors[at]) {
        const d =
          arrival[at] +
          Math.hypot(cells[at].x - cells[n].x, cells[at].y - cells[n].y, cells[at].z - cells[n].z) +
          0.22;
        if (d < arrival[n]) {
          arrival[n] = d;
          parent[n] = at;
        }
      }
    }
    const maximum = Math.max(...arrival);
    arrival.forEach((v, i) => (arrival[i] = 0.48 + (v / maximum) * 2.75));
    for (const e of edges) {
      if (arrival[e.a] > arrival[e.b]) [e.a, e.b] = [e.b, e.a];
      const a = cells[e.a],
        b = cells[e.b],
        bend = (rand() - 0.5) * 0.55;
      const p = lerp3(a, b, 0.32),
        q = lerp3(a, b, 0.7);
      p.y += bend;
      p.z += (rand() - 0.5) * 0.6;
      q.y -= bend * 0.55;
      q.x += (rand() - 0.5) * 0.2;
      e.points = Array.from({ length: 29 }, (_, i) => cubic(a, p, q, b, i / 28));
      e.start = arrival[e.a];
      e.end = arrival[e.b];
      e.silverStart = silverAt(e.start);
      e.silverEnd = silverAt(e.end);
      e.active = parent[e.b] === e.a;
      e.color = cells[e.a].color;
      for (let j = 0; j < 65; j++) {
        const k = Math.floor(rand() * e.points.length),
          p = e.points[k],
          s = 0.014 + rand() * 0.05;
        dust.push({
          x: p.x + (rand() - 0.5) * s,
          y: p.y + (rand() - 0.5) * s,
          z: p.z + (rand() - 0.5) * s,
          size: 0.25 + rand() * 0.7,
          alpha: 0.18 + rand() * 0.48,
          color: e.color,
          silver: mix(e.silverStart, e.silverEnd, k / 28),
        });
      }
    }
    function twig(owner, start, angle, len, z, level) {
      const cell = cells[owner],
        end = {
          x: start.x + Math.cos(angle) * len,
          y: start.y + Math.sin(angle) * len,
          z: start.z + z * len,
        };
      const b = lerp3(start, end, 0.32),
        c = lerp3(start, end, 0.7),
        bend = (rand() - 0.5) * len * 0.8;
      b.x += Math.sin(angle) * bend;
      b.y -= Math.cos(angle) * bend;
      c.z += (rand() - 0.5) * len * 0.3;
      const points = Array.from({ length: 9 }, (_, j) => cubic(start, b, c, end, j / 8));
      const from = silverAt(arrival[owner]) + level * 0.1,
        to = from + 0.1;
      branches.push({ owner, level, points, color: cell.color, silverStart: from, silverEnd: to });
      for (let j = 0; j < (level === 0 ? 6 : 3); j++) {
        const k = Math.floor(rand() * 9),
          p = points[k];
        dust.push({
          x: p.x + (rand() - 0.5) * 0.035,
          y: p.y + (rand() - 0.5) * 0.035,
          z: p.z + (rand() - 0.5) * 0.06,
          size: 0.22 + rand() * 0.4,
          alpha: 0.12 + rand() * 0.35,
          color: cell.color,
          silver: mix(from, to, k / 8),
        });
      }
      if (level < 2) {
        twig(
          owner,
          end,
          angle + 0.25 + rand() * 0.7,
          len * (0.4 + rand() * 0.18),
          z + (rand() - 0.5) * 0.5,
          level + 1,
        );
        twig(
          owner,
          end,
          angle - 0.25 - rand() * 0.75,
          len * (0.43 + rand() * 0.17),
          z + (rand() - 0.5) * 0.5,
          level + 1,
        );
      }
    }
    cells.forEach((cell, i) => {
      const arms = i === 0 ? 11 : 6;
      for (let a = 0; a < arms; a++)
        twig(
          i,
          cell,
          (a / arms) * TAU + rand() * 0.5,
          (i === 0 ? 0.2 : 0.12) + rand() * 0.17,
          (rand() - 0.5) * 1.5,
          0,
        );
      // A diffuse cloud around each soma gives the structure volume without a flat glow disc.
      for (let j = 0; j < 50; j++) {
        const angle = rand() * TAU,
          r = Math.pow(rand(), 1.8) * 0.19;
        dust.push({
          x: cell.x + Math.cos(angle) * r,
          y: cell.y + Math.sin(angle) * r,
          z: cell.z + (rand() - 0.5) * r * 2,
          size: 0.3 + rand() * 0.6,
          alpha: 0.12 + rand() * 0.5,
          color: cell.color,
          silver: silverAt(arrival[i]),
        });
      }
    });
    for (let i = 0; i < 300; i++)
      stars.push({
        x: rand(),
        y: rand(),
        depth: rand(),
        phase: rand() * TAU,
        size: 0.25 + rand() * 0.8,
      });
    const model = { cells, edges, branches, dust, stars, arrival, parent };
    cache.set(count, model);
    return model;
  }
  function frame(seconds, width, height) {
    const small = width <= 700 || (width <= 900 && height > width),
      t = Math.max(0, seconds),
      handoff = ease(4.9, 6.5, t),
      yaw = -0.28 + 0.38 * ease(0, 4.9, t),
      pitch = 0.14 - 0.2 * ease(0, 4.9, t);
    return {
      t,
      width,
      height,
      small,
      handoff,
      opacity: 1 - ease(5.65, 6.6, t),
      reveal: ease(0, 1.6, t),
      cx: width * (small ? 0.51 : 0.66),
      cy: height * (small ? 0.32 : 0.41),
      scale: Math.min(width * (small ? 0.29 : 0.2), height * (small ? 0.26 : 0.38)),
      zoom: 1.75 - 0.75 * ease(0, 3.8, t),
      yaw,
      pitch,
      cosY: Math.cos(yaw),
      sinY: Math.sin(yaw),
      cosP: Math.cos(pitch),
      sinP: Math.sin(pitch),
    };
  }
  function space(p, f) {
    const x = p.x * f.cosY + p.z * f.sinY,
      z = -p.x * f.sinY + p.z * f.cosY,
      y = p.y * f.cosP - z * f.sinP,
      depth = p.y * f.sinP + z * f.cosP,
      scale = 3.8 / (3.8 - depth);
    return {
      x: f.cx + x * f.scale * scale * f.zoom,
      y: f.cy + y * f.scale * scale * f.zoom,
      depth,
      scale,
    };
  }
  // Retain the exact handoff to the existing, live topic network.
  function project(cell, f, target) {
    const p = space(cell, f);
    return { ...p, x: mix(p.x, target.x, f.handoff), y: mix(p.y, target.y, f.handoff) };
  }
  function pulse(model, index, t) {
    const age = t - model.arrival[index];
    return age < 0
      ? 0
      : Math.exp((-age * age) / 0.045) + 0.33 * Math.exp((-(age - 1.55) * (age - 1.55)) / 0.075);
  }
  function light(ctx, x, y, r, color, alpha) {
    if (alpha < 0.001 || r < 0.1) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(0.15, `rgba(${color},${alpha * 0.48})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function stroke(ctx, points, color, width, alpha, start = 0, end = 1) {
    if (alpha < 0.002) return;
    ctx.beginPath();
    const n = points.length - 1,
      first = Math.max(0, Math.floor(start * n)),
      last = Math.min(n, Math.ceil(end * n));
    for (let i = first; i <= last; i++) {
      const p = points[i];
      if (i === first) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = `rgba(${color},${clamp(alpha)})`;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  // During the sweep each path segment changes when the moving front reaches it.
  // Uniform paths keep the cheap single-stroke renderer before and after the wave.
  function silverThread(ctx, points, color, width, alpha, t, from, to) {
    if (t <= from || t >= to + silverSettle) {
      stroke(ctx, points, colorAt(color, t, from), width, alpha);
      return;
    }
    for (let i = 1; i < points.length; i++) {
      const col = colorAt(color, t, mix(from, to, (i - 0.5) / (points.length - 1)));
      stroke(ctx, [points[i - 1], points[i]], col, width, alpha);
    }
  }
  function draw(ctx, { width, height, seconds, projection, reduced = false }) {
    if (reduced || seconds < 0 || seconds >= 6.6 || !projection || width <= 0 || height <= 0)
      return;
    const f = frame(seconds, width, height),
      { layout, points } = projection,
      model = universe(layout.nodes.length),
      fade = (1 - ease(4.75, 5.8, f.t)) * ease(0, 0.5, f.t);
    const cells = model.cells.map((p) => space(p, f)),
      darkness = 1 - ease(4.9, 6.55, f.t);
    ctx.save();
    ctx.fillStyle = `rgba(${colorAt([4, 7, 16], f.t, 3.75)},${darkness})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    if (fade > 0.001) {
      // Vast, quiet distance behind the near-field synapses.
      for (const s of model.stars) {
        const x = (s.x * width + (f.t - 2) * s.depth * 3 + width) % width,
          y = (s.y * height + (f.t - 2) * s.depth + height) % height;
        ctx.fillStyle = `rgba(${colorAt([179, 198, 220], f.t, silverStart + s.depth * 1.35)},${(0.14 + s.depth * 0.36) * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size * (f.small ? 0.8 : 1), 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < cells.length; i++) {
        const p = cells[i],
          c = model.cells[i],
          brightness = pulse(model, i, f.t);
        light(
          ctx,
          p.x,
          p.y,
          f.scale * (i === 0 ? 0.48 : 0.27) * p.scale,
          colorAt(palette[c.color], f.t, silverAt(model.arrival[i])),
          fade * (0.13 + brightness * 0.08),
        );
      }
      // Filaments cross at distinct depths. Arrival times belong to connected paths.
      const projectedEdges = model.edges
        .map((e) => ({
          ...e,
          screen: e.points.map((p) => space(p, f)),
          depth: (cells[e.a].depth + cells[e.b].depth) / 2,
        }))
        .sort((a, b) => a.depth - b.depth);
      for (const e of projectedEdges) {
        const col = palette[e.color],
          depth = clamp((e.depth + 1.1) / 2.2),
          reveal = ease(0.05, 0.7, f.t),
          alpha = fade * reveal * (0.11 + depth * 0.17);
        const filament = e.screen.slice(0, -1);
        silverThread(ctx, filament, col, 8, alpha * 0.12, f.t, e.silverStart, e.silverEnd);
        silverThread(ctx, filament, col, 2.5, alpha * 0.28, f.t, e.silverStart, e.silverEnd);
        silverThread(
          ctx,
          filament,
          col,
          0.5 + depth * 0.55,
          alpha,
          f.t,
          e.silverStart,
          e.silverEnd,
        );
        const wave = (f.t - e.silverStart) / Math.max(0.08, e.silverEnd - e.silverStart);
        if (e.active && wave >= 0 && wave <= 1) {
          const p = e.screen[Math.min(27, Math.floor(wave * 28))];
          light(ctx, p.x, p.y, 10 * p.scale, [235, 235, 235], fade * 0.48);
          stroke(
            ctx,
            e.screen,
            [238, 238, 238],
            1 + depth,
            fade * 0.7,
            Math.max(0, wave - 0.09),
            Math.min(0.96, wave),
          );
        }
        for (const repeat of [0, 1.55]) {
          const age = (f.t - e.start - repeat) / Math.max(0.16, e.end - e.start);
          if (!e.active || age < 0 || age > 1) continue;
          stroke(
            ctx,
            e.screen,
            colorAt([255, 215, 178], f.t, mix(e.silverStart, e.silverEnd, age)),
            1.1 + depth,
            fade * 0.9,
            Math.max(0, age - 0.1),
            Math.min(0.96, age),
          );
          const idx = Math.min(27, Math.floor(age * 28)),
            p = e.screen[idx];
          light(
            ctx,
            p.x,
            p.y,
            11 * p.scale,
            colorAt([255, 168, 103], f.t, mix(e.silverStart, e.silverEnd, age)),
            fade * 0.58,
          );
        }
      }
      for (const branch of model.branches) {
        const p = cells[branch.owner],
          n = clamp((p.depth + 1) / 2),
          activity = pulse(model, branch.owner, f.t),
          r = ease(0.02, 0.65, f.t),
          ps = branch.points.map((v) => space(v, f));
        silverThread(
          ctx,
          ps,
          palette[branch.color],
          (branch.level === 0 ? 1 : 0.5) * (p.scale * 0.6 + 0.4),
          (fade * r * (0.15 + n * 0.28 + activity * 0.26)) / (1 + branch.level * 0.24),
          f.t,
          branch.silverStart,
          branch.silverEnd,
        );
      }
      // Fine luminous matter follows the actual cells and filaments, never a random dot mesh.
      for (let i = 0; i < model.dust.length; i += f.small ? 2 : 1) {
        const d = model.dust[i],
          p = space(d, f);
        if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) continue;
        ctx.fillStyle = `rgba(${colorAt(palette[d.color], f.t, d.silver)},${d.alpha * fade * (0.5 + clamp(p.depth + 1) * 0.3)})`;
        ctx.fillRect(p.x, p.y, d.size * p.scale, d.size * p.scale);
      }
      const order = cells.map((p, i) => ({ p, i })).sort((a, b) => a.p.depth - b.p.depth);
      for (const { p, i } of order) {
        const cell = model.cells[i],
          activity = pulse(model, i, f.t),
          alpha = fade * ease(0, 0.6, f.t),
          r = (f.small ? 2 : 2.7) * cell.size * p.scale,
          at = silverAt(model.arrival[i]),
          col = colorAt(palette[cell.color], f.t, at);
        light(ctx, p.x, p.y, r * (7 + activity * 4), col, alpha * (0.35 + activity * 0.48));
        ctx.beginPath();
        for (let j = 0; j <= 12; j++) {
          const a = (j / 12) * TAU,
            rr = r * (1 + 0.23 * Math.sin(a * 5 + cell.phase));
          const x = p.x + Math.cos(a) * rr,
            y = p.y + Math.sin(a) * rr;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.fillStyle = `rgba(${col},${alpha * 0.7})`;
        ctx.fill();
        ctx.fillStyle = `rgba(${colorAt([255, 245, 220], f.t, at)},${alpha * (0.75 + activity * 0.25)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    // The cosmos resolves into the real topics rather than ending on a separate title card.
    if (f.handoff > 0) {
      const nodes = model.cells.map((cell, i) => project(cell, f, points[i])),
        a = Math.sin(f.handoff * Math.PI) * 0.7;
      for (const e of model.edges)
        stroke(ctx, [nodes[e.a], nodes[e.b]], [154, 154, 154], 0.7, a * 0.3);
      for (const p of nodes) {
        ctx.fillStyle = `rgba(158,158,158,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  const api = { frame, project, universe, space, pulse, silverAt, colorAt, draw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SignatureSculpture = api;
})(typeof window !== 'undefined' ? window : this);
