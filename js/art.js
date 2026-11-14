/* PUG PINBALL WORLD - パグの世界の描画パーツ（すべてCanvasで描くオリジナル素材） */
(function () {
  'use strict';
  const PP = window.PP, TAU = Math.PI * 2;
  const FUR = PP.FUR = {
    fawn: { c: '#f0cf9c', d: '#d9a868', m: '#3d2c26', ear: '#3d2c26' },
    black: { c: '#44444c', d: '#26262b', m: '#151518', ear: '#151518', ring: '#8a8a96' },
    white: { c: '#fffaf0', d: '#e9dcc6', m: '#c2ab92', ear: '#c2ab92' },
    silver: { c: '#cdd1da', d: '#a2a7b3', m: '#4d505a', ear: '#4d505a' },
    apricot: { c: '#f6b06a', d: '#dc8a3e', m: '#3d2c26', ear: '#50332a' },
    gold: { c: '#ffe36b', d: '#e2a900', m: '#8f5f00', ear: '#a87200' },
    rainbow: { c: '#fff', d: '#fff', m: '#5b3a7a', ear: '#7a4fb0' },
    ghost: { c: '#f4f1ff', d: '#cfc6f5', m: '#9a8fd0', ear: '#b3a8e6' },
    shisa: { c: '#ff8a4c', d: '#d8492b', m: '#7a1f12', ear: '#ffd24a' }
  };
  const el = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const ci = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  function star(c, x, y, r, n) { c.beginPath(); for (let i = 0; i < (n || 5) * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / (n || 5), rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  function heart(c, x, y, r) { c.beginPath(); c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); }
  function paw(c, x, y, r) { el(c, x, y + r * 0.25, r * 0.6, r * 0.5); c.fill(); for (let i = 0; i < 4; i++) { const a = -2.5 + i * 0.63; el(c, x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.8 + r * 0.15, r * 0.24, r * 0.3); c.fill(); } }
  function bone(c, x, y, len, w) { c.beginPath(); c.roundRect(x - len / 2, y - w / 2, len, w, w / 2); c.fill(); for (const s of [-1, 1]) for (const t of [-1, 1]) { ci(c, x + s * len / 2, y + t * w * 0.55, w * 0.62); c.fill(); } }
  PP.shape = { star, heart, paw, bone, el, ci };

  // ===== パグの顔 =====
  function pugFace(c, r, o) {
    o = o || {}; const f = FUR[o.fur] || FUR.fawn, ex = o.expr || 'normal';
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (o.acc === 'helmet') { c.fillStyle = 'rgba(160,220,255,.28)'; ci(c, 0, 0, r * 1.22); c.fill(); }
    c.fillStyle = f.ear;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * r * 0.42, -r * 0.86); c.quadraticCurveTo(s * r * 1.2, -r * 1.02, s * r * 1.04, -r * 0.05); c.quadraticCurveTo(s * r * 0.72, -r * 0.42, s * r * 0.42, -r * 0.86); c.fill(); }
    let g;
    if (o.fur === 'rainbow') { g = c.createLinearGradient(-r, -r, r, r);['#ff7b7b', '#ffd95a', '#7be08a', '#62a8ff', '#c98bff'].forEach((k, i) => g.addColorStop(i / 4, k)); }
    else { g = c.createRadialGradient(-r * 0.3, -r * 0.45, r * 0.1, 0, 0, r * 1.05); g.addColorStop(0, f.c); g.addColorStop(1, f.d); }
    c.fillStyle = g; ci(c, 0, 0, r); c.fill();
    c.strokeStyle = 'rgba(60,30,10,.28)'; c.lineWidth = Math.max(0.6, r * 0.055);
    c.beginPath(); c.arc(0, -r * 0.12, r * 0.52, -2.15, -0.99); c.stroke(); c.beginPath(); c.arc(0, r * 0.06, r * 0.5, -1.95, -1.19); c.stroke();
    c.fillStyle = f.m; el(c, 0, r * 0.4, r * 0.56, r * 0.43); c.fill();
    // 目
    const ex0 = r * 0.45, ey = -r * 0.03, er = r * 0.2;
    for (const s of [-1, 1]) {
      const x = s * ex0;
      if (ex === 'happy') { c.strokeStyle = '#1b1310'; c.lineWidth = r * 0.11; c.beginPath(); c.arc(x, ey + er * 0.5, er, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      else if (ex === 'sleepy') { c.strokeStyle = '#1b1310'; c.lineWidth = r * 0.1; c.beginPath(); c.arc(x, ey - er * 0.3, er, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
      else if (ex === 'star') { c.fillStyle = '#ffe14a'; c.strokeStyle = '#b77800'; c.lineWidth = r * 0.04; star(c, x, ey, er * 1.35); c.fill(); c.stroke(); }
      else {
        const big = ex === 'surprised';
        if (f.ring || big) { c.fillStyle = big ? '#fff' : f.ring; ci(c, x, ey, er * (big ? 1.3 : 1.15)); c.fill(); }
        c.fillStyle = '#1b1310'; ci(c, x, ey, big ? er * 0.62 : er); c.fill();
        c.fillStyle = '#fff'; ci(c, x - er * 0.3, ey - er * 0.32, er * (big ? 0.2 : 0.32)); c.fill();
        if (ex === 'sad') { c.strokeStyle = '#1b1310'; c.lineWidth = r * 0.07; c.beginPath(); c.moveTo(x - s * er * 1.2, ey - er * 1.7); c.lineTo(x + s * er * 0.9, ey - er * 1.25); c.stroke(); c.fillStyle = '#7fd4ff'; el(c, x + s * er * 0.9, ey + er * 1.5, er * 0.3, er * 0.5); c.fill(); }
      }
    }
    // 鼻と口
    c.fillStyle = '#0c0808'; el(c, 0, r * 0.2, r * 0.17, r * 0.115); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; el(c, -r * 0.05, r * 0.16, r * 0.06, r * 0.03); c.fill();
    const mc = o.fur === 'white' || o.fur === 'ghost' ? '#6d5a4a' : '#d9b8a0';
    if (ex === 'happy' || ex === 'star') { c.fillStyle = '#5a1a1a'; c.beginPath(); c.arc(0, r * 0.42, r * 0.26, 0, Math.PI); c.fill(); c.fillStyle = '#ff7f9f'; el(c, 0, r * 0.6, r * 0.15, r * 0.17); c.fill(); }
    else if (ex === 'surprised') { c.fillStyle = '#5a1a1a'; el(c, 0, r * 0.55, r * 0.11, r * 0.14); c.fill(); }
    else { c.strokeStyle = mc; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(0, r * 0.3); c.lineTo(0, r * 0.44); c.arc(-r * 0.14, r * 0.44, r * 0.14, 0, Math.PI * (ex === 'sad' ? -0.9 : 0.9), ex === 'sad'); c.moveTo(0, r * 0.44); c.arc(r * 0.14, r * 0.44, r * 0.14, Math.PI, Math.PI * (ex === 'sad' ? 1.9 : 0.1), ex !== 'sad'); c.stroke(); }
    acc(c, r, o.acc);
    c.restore();
  }
  function acc(c, r, a) {
    if (!a) return;
    if (a === 'crown') { c.fillStyle = '#ffd43b'; c.strokeStyle = '#b8860b'; c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.78); c.lineTo(-r * 0.58, -r * 1.3); c.lineTo(-r * 0.25, -r * 1.02); c.lineTo(0, -r * 1.42); c.lineTo(r * 0.25, -r * 1.02); c.lineTo(r * 0.58, -r * 1.3); c.lineTo(r * 0.5, -r * 0.78); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ff4d6d'; ci(c, 0, -r * 0.95, r * 0.09); c.fill(); }
    else if (a === 'helmet') { c.strokeStyle = '#dff3ff'; c.lineWidth = r * 0.1; ci(c, 0, 0, r * 1.22); c.stroke(); c.strokeStyle = '#ff6b6b'; c.lineWidth = r * 0.07; c.beginPath(); c.moveTo(r * 0.7, -r * 1.0); c.lineTo(r * 0.95, -r * 1.45); c.stroke(); c.fillStyle = '#ff6b6b'; ci(c, r * 0.95, -r * 1.48, r * 0.12); c.fill(); }
    else if (a === 'flower') { c.fillStyle = '#ff3b5c'; for (let i = 0; i < 5; i++) { const an = i * TAU / 5; el(c, r * 0.72 + Math.cos(an) * r * 0.2, -r * 0.72 + Math.sin(an) * r * 0.2, r * 0.2, r * 0.2); c.fill(); } c.fillStyle = '#ffd43b'; ci(c, r * 0.72, -r * 0.72, r * 0.11); c.fill(); }
    else if (a === 'towel') { c.fillStyle = '#fff'; c.strokeStyle = '#8fd0e8'; c.lineWidth = r * 0.06; c.beginPath(); c.roundRect(-r * 0.5, -r * 1.2, r, r * 0.42, r * 0.12); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-r * 0.3, -r * 0.99); c.lineTo(r * 0.3, -r * 0.99); c.stroke(); }
    else if (a === 'candy') { c.fillStyle = '#ff7eb6'; ci(c, -r * 0.7, -r * 0.8, r * 0.26); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * 0.07; c.beginPath(); c.arc(-r * 0.7, -r * 0.8, r * 0.14, 0, 4.5); c.stroke(); }
    else if (a === 'band') { c.fillStyle = '#d7263d'; c.beginPath(); c.roundRect(-r * 0.98, -r * 0.62, r * 1.96, r * 0.26, r * 0.08); c.fill(); c.beginPath(); c.moveTo(r * 0.9, -r * 0.5); c.lineTo(r * 1.4, -r * 0.75); c.lineTo(r * 1.35, -r * 0.35); c.fill(); }
    else if (a === 'halo') { c.strokeStyle = '#ffe066'; c.lineWidth = r * 0.12; c.beginPath(); c.ellipse(0, -r * 1.15, r * 0.55, r * 0.16, 0, 0, TAU); c.stroke(); }
  }
  PP.pugFace = pugFace;

  // スプライトキャッシュ
  const cache = new Map();
  PP.sprite = function (key, size, draw) {
    let s = cache.get(key); if (s) return s;
    s = document.createElement('canvas'); s.width = s.height = size; const c = s.getContext('2d'); c.translate(size / 2, size / 2); draw(c); cache.set(key, s);
    if (cache.size > 220) cache.delete(cache.keys().next().value); return s;
  };
  PP.pugSprite = function (fur, expr, accn, px) { px = px || 96; return PP.sprite('pug|' + fur + '|' + expr + '|' + (accn || '') + '|' + px, px, c => pugFace(c, px * (accn ? 0.3 : 0.4), { fur, expr, acc: accn })); };

  // ===== ノーマルのボール（金属球） =====
  PP.drawBall = function (c, r, skin) {
    let g;
    if (!skin.c) { g = c.createLinearGradient(-r, -r, r, r);['#ff7b7b', '#ffd95a', '#7be08a', '#62a8ff', '#c98bff'].forEach((k, i) => g.addColorStop(i / 4, k)); }
    else { g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r * 1.05); g.addColorStop(0, skin.c[0]); g.addColorStop(0.45, skin.c[1]); g.addColorStop(1, skin.c[2]); }
    c.fillStyle = g; ci(c, 0, 0, r); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(0.8, r * 0.07); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; el(c, -r * 0.36, -r * 0.42, r * 0.26, r * 0.17); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(0, 0, r * 0.78, 0.5, 1.6); c.arc(0, 0, r * 0.62, 1.6, 0.5, true); c.fill();
  };
  PP.ballSprite = function (skin, px) { px = px || 96; return PP.sprite('ball|' + skin.id + '|' + px, px, c => PP.drawBall(c, px * 0.4, skin)); };

  // ===== バンパー =====
  const PLANET = [['#ff9f6b', '#c8553d'], ['#7fd1ff', '#2f7fc1'], ['#ffd86b', '#d98a1e'], ['#c9a2ff', '#7b4fd0'], ['#8fe3a0', '#2f9e5b']];
  function bumper(c, m, t, style) {
    const r = m.r, k = m.kind, hit = m.hitT > 0 ? m.hitT / 0.25 : 0; c.save(); c.translate(m.x, m.y); const sc = 1 + hit * 0.16; c.scale(sc, sc);
    if (style === 'neon' || style === 'gold') { c.strokeStyle = style === 'neon' ? 'rgba(90,240,255,.9)' : 'rgba(255,205,60,.95)'; c.lineWidth = 3; ci(c, 0, 0, r + 3); c.stroke(); }
    if (k === 'paw' || k === 'gold') { const g = k === 'gold'; c.fillStyle = g ? '#ffd84a' : '#ff9ec4'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = g ? '#c58a00' : '#e0679a'; c.lineWidth = 2.5; c.stroke(); c.fillStyle = g ? '#fff3b0' : '#ffe1ee'; paw(c, 0, 0, r * 0.62); }
    else if (k === 'face') { c.fillStyle = '#fff'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#ff8fab'; c.lineWidth = 3; c.stroke(); pugFace(c, r * 0.72, { expr: hit ? 'surprised' : 'normal' }); }
    else if (k === 'plush') { c.fillStyle = '#e9ddff'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#9d86e0'; c.lineWidth = 2.5; c.setLineDash([4, 3]); c.stroke(); c.setLineDash([]); pugFace(c, r * 0.7, { fur: 'ghost', expr: hit ? 'surprised' : 'sleepy' }); }
    else if (k === 'butt') { const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, '#f0cf9c'); g.addColorStop(1, '#d9a868'); c.fillStyle = g; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#a5743c'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1.6; c.beginPath(); c.arc(-r * 0.42, r * 0.25, r * 0.5, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(r * 0.42, r * 0.25, r * 0.5, Math.PI - 0.9, Math.PI + 0.9); c.stroke(); c.fillStyle = '#e2b77c'; c.lineWidth = 2; ci(c, 0, -r * 0.5, r * 0.34); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -r * 0.5, r * 0.15, 0.4, TAU * 0.85); c.stroke(); c.fillStyle = '#ffb3c8'; ci(c, 0, r * 0.3, r * 0.1); c.fill(); }
    else if (k === 'cushion') { c.fillStyle = '#ff6b81'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#c93a55'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * 1.047) * r * 0.85, Math.sin(i * 1.047) * r * 0.85); c.stroke(); } c.fillStyle = '#ffe066'; ci(c, 0, 0, r * 0.2); c.fill(); }
    else if (k === 'food') { c.fillStyle = '#a8662f'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#6e3d14'; c.lineWidth = 2.5; c.stroke(); c.fillStyle = '#c98a4f'; bone(c, 0, 0, r * 0.8, r * 0.3); c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 5; i++) { ci(c, Math.cos(i * 1.26 + 0.4) * r * 0.68, Math.sin(i * 1.26 + 0.4) * r * 0.68, r * 0.08); c.fill(); } }
    else if (k === 'shisa') { c.fillStyle = '#ffd24a'; for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + 0.3; ci(c, Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.26); c.fill(); } pugFace(c, r * 0.8, { fur: 'shisa', expr: hit ? 'surprised' : 'happy' }); }
    else if (k === 'planet') { const p = PLANET[(m.c || 0) % 5], g = c.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r); g.addColorStop(0, p[0]); g.addColorStop(1, p[1]); c.fillStyle = g; ci(c, 0, 0, r); c.fill(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, r * 1.25, r * 0.32, -0.35, 0.15, Math.PI - 0.15); c.stroke(); c.fillStyle = 'rgba(0,0,0,.15)'; ci(c, r * 0.3, r * 0.25, r * 0.18); c.fill(); ci(c, -r * 0.35, r * 0.1, r * 0.12); c.fill(); }
    else if (k === 'fish') { const dir = m.slide ? (Math.sin((t / m.slide[4] + m.slide[5]) * TAU) >= 0 ? 1 : -1) * Math.sign(m.slide[2] - m.slide[0]) : 1; c.scale(dir, 1); c.fillStyle = '#ffb347'; el(c, 0, 0, r, r * 0.78); c.fill(); c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(-r * 1.45, -r * 0.6); c.lineTo(-r * 1.45, r * 0.6); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(-r * 0.1, 0, r * 0.7, -0.9, 0.9); c.stroke(); c.fillStyle = '#fff'; ci(c, r * 0.5, -r * 0.2, r * 0.22); c.fill(); c.fillStyle = '#222'; ci(c, r * 0.55, -r * 0.2, r * 0.1); c.fill(); }
    else if (k === 'candy') { c.fillStyle = '#fff'; ci(c, 0, 0, r); c.fill(); c.save(); c.rotate(t * 1.5); c.fillStyle = '#ff5c8a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, i * 1.571, i * 1.571 + 0.785); c.fill(); } c.restore(); c.strokeStyle = '#d63a6a'; c.lineWidth = 2.5; ci(c, 0, 0, r); c.stroke(); }
    else if (k === 'snow') { const g = c.createRadialGradient(-r * 0.3, -r * 0.4, 1, 0, 0, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#bcdcf5'); c.fillStyle = g; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#7fb4dc'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#333'; ci(c, -r * 0.3, -r * 0.1, r * 0.09); c.fill(); ci(c, r * 0.3, -r * 0.1, r * 0.09); c.fill(); c.fillStyle = '#ff8c42'; ci(c, 0, r * 0.15, r * 0.1); c.fill(); }
    else if (k === 'manju') { c.fillStyle = '#b9713c'; el(c, 0, 0, r, r * 0.92); c.fill(); c.strokeStyle = '#7d4520'; c.lineWidth = 2.5; c.stroke(); c.strokeStyle = '#fff3e0'; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * r * 0.3, r * 0.1); c.quadraticCurveTo(i * r * 0.3 + r * 0.14, -r * 0.2, i * r * 0.3, -r * 0.5); c.stroke(); } c.beginPath(); c.arc(0, r * 0.25, r * 0.5, 0.2, Math.PI - 0.2); c.stroke(); }
    else if (k === 'bowl') { c.fillStyle = '#c99b6b'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#7a5230'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#8fe0f0'; ci(c, 0, 0, r * 0.66); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; el(c, -r * 0.2, -r * 0.2, r * 0.2, r * 0.1); c.fill(); }
    else if (k === 'chest') { c.fillStyle = '#b8742a'; c.beginPath(); c.roundRect(-r, -r * 0.8, r * 2, r * 1.6, 4); c.fill(); c.strokeStyle = '#ffd24a'; c.lineWidth = 2.5; c.stroke(); c.beginPath(); c.moveTo(-r, -r * 0.1); c.lineTo(r, -r * 0.1); c.stroke(); c.fillStyle = '#ffd24a'; ci(c, 0, -r * 0.1, r * 0.22); c.fill(); }
    else if (k === 'boss') { c.fillStyle = hit ? '#fff' : '#ffe9a8'; ci(c, 0, 0, r); c.fill(); c.strokeStyle = '#d7263d'; c.lineWidth = 4; c.stroke(); pugFace(c, r * 0.74, { expr: hit ? 'surprised' : m.hp <= m.hpMax / 2 ? 'sad' : 'normal', acc: 'crown' }); }
    else if (k === 'eel') { c.restore(); eel(c, m, t); return; }
    if (m.secret && Math.sin(t * 3 + m.x) > 0.6) { c.fillStyle = 'rgba(255,255,255,.9)'; star(c, r * 0.75, -r * 0.75, 4, 4); c.fill(); }
    c.restore();
  }
  function eel(c, m, t) { // チンアナゴ(0)とニシキアナゴ(1)
    const h = 34 * m.rise, sw = Math.sin(t * 2 + m.x) * 3 * m.rise; c.save(); c.translate(m.x, m.y + 12);
    c.fillStyle = '#e8d6a8'; el(c, 0, 2, 13, 5); c.fill();
    if (h > 2) {
      c.lineCap = 'round'; c.lineWidth = 9; c.strokeStyle = m.skin ? '#ff9d3c' : '#f7f7f2'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sw * 2, -h * 0.5, sw, -h); c.stroke();
      if (m.skin) { c.strokeStyle = '#fff'; c.lineWidth = 9; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(sw * 2, -h * 0.5, sw, -h + 6); c.stroke(); c.setLineDash([]); }
      else { c.fillStyle = '#333'; for (let i = 1; i < 4; i++) { ci(c, sw * i / 4 + (i % 2 ? 2 : -2), -h * i / 4, 1.6); c.fill(); } }
      c.fillStyle = '#111'; ci(c, sw - 2.4, -h + 1, 1.5); c.fill(); ci(c, sw + 2.4, -h + 1, 1.5); c.fill();
    }
    c.restore();
  }
  PP.drawBumper = bumper;

  // ===== ターゲット =====
  PP.drawTarget = function (c, tg, t) {
    const s = tg.seg, k = tg.kind; c.save(); c.translate(tg.x, tg.y);
    if (tg.down) { c.globalAlpha = 0.22; }
    if (tg.hitT > 0) c.scale(1.25, 1.25);
    if (tg.peg) {
      if (k === 'num') { c.fillStyle = tg.down ? '#888' : '#ffd24a'; ci(c, 0, 0, 9); c.fill(); c.strokeStyle = '#7a4fd0'; c.lineWidth = 2.5; c.stroke(); c.fillStyle = '#3a2d52'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tg.seq, 0, 0.5); }
      else { c.fillStyle = '#a8662f'; ci(c, 0, 0, 9); c.fill(); c.strokeStyle = '#6e3d14'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#d9a066'; star(c, 0, 0, 5, 4); c.fill(); }
    } else {
      const side = tg.x < 185 ? 1 : -1; c.rotate(Math.PI / 2); // 壁から飛び出す形で描く
      const col = { bone: '#fffdf5', manju: '#b9713c', goya: '#4caf50', star: '#ffe14a', ice: '#bfe9ff' }[k] || '#fff';
      c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5;
      if (k === 'bone') { bone(c, 0, -side * 3, 18, 6); }
      else if (k === 'goya') { el(c, 0, -side * 3, 13, 6); c.fill(); c.stroke(); c.fillStyle = '#2e7d32'; for (let i = -2; i <= 2; i++) { ci(c, i * 4.5, -side * 3, 1.5); c.fill(); } }
      else if (k === 'star') { star(c, 0, -side * 4, 10); c.fill(); c.stroke(); }
      else if (k === 'ice') { c.beginPath(); c.moveTo(-12, side * 2); c.lineTo(12, side * 2); c.lineTo(0, -side * 12); c.closePath(); c.fill(); c.stroke(); }
      else { el(c, 0, -side * 3, 12, 7); c.fill(); c.stroke(); }
    }
    c.restore();
  };

  // ===== しっぽフリッパー =====
  PP.drawTail = function (c, f, col, vis, t) {
    const L = PP.FL; c.save(); c.translate(f.px, f.py); c.rotate(f.a + (vis.wob || 0)); const st = 1 + (vis.str || 0);
    c.fillStyle = col.c; c.strokeStyle = col.d; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(L * 0.5, -8.5, L * st, -4.8); c.arc(L * st, 0, 4.8, -Math.PI / 2, Math.PI / 2); c.quadraticCurveTo(L * 0.5, 8.5, 0, 8); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5; for (let i = 1; i < 5; i++) { c.beginPath(); c.arc(i * L / 5.2, 0, 5.5 - i * 0.5, -1.1, 1.1); c.stroke(); }
    c.strokeStyle = col.d; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.arc(L * st - 2, 0, 2.6, 0.6 + (vis.curl || 0), 5.4 + (vis.curl || 0)); c.stroke();
    c.fillStyle = col.c; c.strokeStyle = col.d; c.lineWidth = 2; ci(c, 0, 0, 10); c.fill(); c.stroke(); c.fillStyle = col.d; ci(c, 0, 0, 3); c.fill();
    c.restore();
  };

  // ===== 背景の装飾（視認性を妨げない薄さ） =====
  PP.drawDeco = function (c, d, th) {
    c.save(); c.globalAlpha = 0.3; const R = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
    if (d === 'town') { for (let i = 0; i < 5; i++) { const x = 40 + i * 62, h = 50 + R(i) * 40, y = 500 - h; c.fillStyle = ['#ff9aa2', '#ffdac1', '#b5ead7', '#c7ceea', '#ffe5a8'][i]; c.fillRect(x, y, 46, h); c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 6, y - 22); c.lineTo(x + 16, y); c.moveTo(x + 30, y); c.lineTo(x + 40, y - 22); c.lineTo(x + 50, y); c.fill(); c.fillStyle = '#fff'; c.fillRect(x + 8, y + 12, 10, 10); c.fillRect(x + 28, y + 12, 10, 10); } c.fillStyle = '#fff'; el(c, 90, 150, 30, 12); c.fill(); el(c, 280, 180, 36, 13); c.fill(); }
    else if (d === 'park') { c.strokeStyle = '#fff'; c.lineWidth = 4; ci(c, 185, 400, 80); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * 0.785; c.beginPath(); c.moveTo(185, 400); c.lineTo(185 + Math.cos(a) * 80, 400 + Math.sin(a) * 80); c.stroke(); c.fillStyle = ['#ff6b81', '#ffd43b', '#69db7c', '#74c0fc'][i % 4]; ci(c, 185 + Math.cos(a) * 80, 400 + Math.sin(a) * 80, 9); c.fill(); } for (let i = 0; i < 12; i++) { c.fillStyle = ['#ff6b81', '#ffd43b', '#74c0fc'][i % 3]; ci(c, 30 + R(i) * 320, 130 + R(i + 9) * 80, 5); c.fill(); } }
    else if (d === 'onsen') { c.fillStyle = '#8d6e63'; for (let i = 0; i < 9; i++) { const a = i * 0.7; el(c, 185 + Math.cos(a) * 105, 285 + Math.sin(a) * 62, 16, 11); c.fill(); } c.strokeStyle = '#e57373'; c.lineWidth = 3; for (const [x, y] of [[70, 440], [300, 440], [185, 150]]) { for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * 8, y); c.quadraticCurveTo(x + i * 8 + 5, y - 10, x + i * 8, y - 20); c.stroke(); } c.beginPath(); c.arc(x, y + 4, 14, 0.2, Math.PI - 0.2); c.stroke(); } }
    else if (d === 'okinawa') { c.fillStyle = '#ffe066'; ci(c, 300, 250, 34); c.fill(); c.fillStyle = '#f6e0a8'; c.beginPath(); c.moveTo(14, 520); c.quadraticCurveTo(185, 420, 356, 520); c.lineTo(356, 720); c.lineTo(14, 720); c.fill(); c.strokeStyle = '#7a5230'; c.lineWidth = 5; c.beginPath(); c.moveTo(70, 470); c.quadraticCurveTo(78, 400, 62, 350); c.stroke(); c.strokeStyle = '#2e9e5b'; c.lineWidth = 6; for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.5; c.beginPath(); c.moveTo(62, 350); c.quadraticCurveTo(62 + Math.cos(a) * 25, 350 + Math.sin(a) * 25 - 8, 62 + Math.cos(a) * 44, 350 + Math.sin(a) * 30 + 10); c.stroke(); } }
    else if (d === 'sea') { c.fillStyle = '#e8d6a8'; c.beginPath(); c.moveTo(14, 440); c.quadraticCurveTo(100, 420, 185, 440); c.quadraticCurveTo(270, 460, 356, 436); c.lineTo(356, 720); c.lineTo(14, 720); c.fill(); c.strokeStyle = '#2e9e5b'; c.lineWidth = 5; for (let i = 0; i < 5; i++) { const x = 40 + i * 70; c.beginPath(); c.moveTo(x, 470); c.bezierCurveTo(x - 12, 430, x + 12, 400, x, 360 + R(i) * 30); c.stroke(); } c.strokeStyle = '#fff'; c.lineWidth = 1.5; for (let i = 0; i < 18; i++) { ci(c, 30 + R(i) * 320, 80 + R(i + 3) * 380, 2 + R(i + 5) * 5); c.stroke(); } }
    else if (d === 'space') { c.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { ci(c, 16 + R(i) * 370, 20 + R(i + 40) * 690, 0.6 + R(i + 80) * 1.6); c.fill(); } c.fillStyle = '#ffe9a8'; ci(c, 70, 470, 26); c.fill(); c.fillStyle = '#3b2a7a'; ci(c, 80, 462, 22); c.fill(); }
    else if (d === 'candy') { c.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { c.save(); c.translate(14 + i * 44, 0); c.transform(1, 0, -0.3, 1, 0, 0); c.fillRect(0, 0, 18, 720); c.restore(); } }
    else if (d === 'snow') { c.fillStyle = '#2e7d5b'; for (let i = 0; i < 4; i++) { const x = 60 + i * 85, y = 500; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x, y - 80 + j * 18); c.lineTo(x - 16 - j * 7, y - 44 + j * 20); c.lineTo(x + 16 + j * 7, y - 44 + j * 20); c.fill(); } } c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ci(c, 16 + R(i) * 340, 20 + R(i + 20) * 600, 1.5 + R(i + 7) * 2); c.fill(); } }
    else if (d === 'castle') { c.strokeStyle = '#1f1633'; c.lineWidth = 1.5; for (let y = 140; y < 720; y += 24) { c.beginPath(); c.moveTo(14, y); c.lineTo(356, y); c.stroke(); for (let x = 14 + ((y / 24) % 2) * 24; x < 356; x += 48) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 24); c.stroke(); } } c.fillStyle = '#ffd24a'; for (const x of [70, 300]) { c.beginPath(); c.roundRect(x - 12, 450, 24, 36, [12, 12, 0, 0]); c.fill(); } }
    else if (d === 'kingdom') { c.fillStyle = '#ffd24a'; for (let i = 0; i < 6; i++) { const x = 50 + (i % 3) * 135, y = 380 + Math.floor(i / 3) * 90; c.beginPath(); c.moveTo(x - 14, y + 10); c.lineTo(x - 16, y - 10); c.lineTo(x - 7, y); c.lineTo(x, y - 14); c.lineTo(x + 7, y); c.lineTo(x + 16, y - 10); c.lineTo(x + 14, y + 10); c.fill(); } c.fillStyle = '#fff'; for (let i = 0; i < 20; i++) { star(c, 20 + R(i) * 330, 30 + R(i + 11) * 300, 3 + R(i) * 3, 4); c.fill(); } }
    else if (d === 'heaven') { c.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { const x = 30 + R(i) * 300, y = 150 + i * 70; el(c, x, y, 34, 13); c.fill(); el(c, x + 22, y - 8, 20, 12); c.fill(); } c.lineWidth = 7; ['#ff7b7b', '#ffd95a', '#7be08a', '#62a8ff'].forEach((k, i) => { c.strokeStyle = k; c.beginPath(); c.arc(185, 560, 150 - i * 8, Math.PI, 0); c.stroke(); }); }
    c.restore();
  };
})();
