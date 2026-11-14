/* PUG PINBALL WORLD - ゲーム画面の描画（Canvas） */
(function () {
  'use strict';
  const PP = window.PP, TAU = Math.PI * 2, TW = 400, TH = 720, HUD = 46, FULL = TH + HUD;
  const FONT = '"Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP","Yu Gothic UI",system-ui,sans-serif';
  const S = PP.shape;

  class Renderer {
    constructor(canvas) { this.cv = canvas; this.c = canvas.getContext('2d'); this.parts = []; this.pops = []; this.banners = []; this.flyers = []; this.vis = [{}, {}]; this.t = 0; this.shake = 0; this.charge = -1; this.tut = null; this.mood = null; this.moodT = 0; this.quality = 'high'; }
    resize() {
      const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, this.quality === 'low' ? 1 : 2);
      this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px'; this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
      const sa = this.safe || { t: 0, b: 0 }, ah = h - sa.t - sa.b;
      this.sc = Math.min(w / TW, ah / FULL); this.ox = (w - TW * this.sc) / 2; this.oy = sa.t + (ah - FULL * this.sc) / 2; this.dpr = dpr; this.w = w; this.h = h; this.stat = null;
    }
    // 画面座標 → テーブル座標
    toTable(x, y) { return { x: (x - this.ox) / this.sc, y: (y - this.oy) / this.sc - HUD }; }
    setGame(g, look) { this.g = g; this.look = look; this.stat = null; this.parts.length = 0; this.pops.length = 0; this.banners.length = 0; this.flyers.length = 0; this.tut = null; this.charge = -1; }

    // ----- 動かない部分は1回だけ描いてキャッシュ -----
    buildStatic() {
      const g = this.g, th = g.st.theme, lk = this.look, k = this.sc * this.dpr;
      const cv = this.stat = document.createElement('canvas'); cv.width = this.cv.width; cv.height = this.cv.height; const c = cv.getContext('2d');
      const bgG = c.createLinearGradient(0, 0, 0, cv.height); bgG.addColorStop(0, '#2b2140'); bgG.addColorStop(1, '#151022'); c.fillStyle = bgG; c.fillRect(0, 0, cv.width, cv.height);
      c.setTransform(k, 0, 0, k, this.ox * this.dpr, (this.oy + HUD * this.sc) * this.dpr);
      const outline = () => { c.beginPath(); c.moveTo(14, 730); c.lineTo(14, 200); c.arc(200, 200, 186, Math.PI, TAU); c.lineTo(386, 730); c.closePath(); };
      c.save(); outline(); c.clip();
      const dark = lk.bg === 'dark', gr = c.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, dark ? '#262040' : th.a); gr.addColorStop(1, dark ? '#15122a' : th.b); c.fillStyle = gr; c.fillRect(0, 0, TW, TH + 20);
      if (!dark) PP.drawDeco(c, th.deco, th);
      if (lk.bg === 'dots') { c.fillStyle = 'rgba(255,255,255,.28)'; for (let y = 30; y < TH; y += 34) for (let x = 20 + (y / 34 % 2) * 17; x < 380; x += 34) { S.ci(c, x, y, 5); c.fill(); } }
      if (lk.bg === 'stars') { c.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 60; i++) { const r = Math.sin(i * 91.7) * 9999, x = 20 + (r - Math.floor(r)) * 350, q = Math.sin(i * 33.1) * 9999, y = 20 + (q - Math.floor(q)) * 680; S.star(c, x, y, 3 + (i % 3), 4); c.fill(); } }
      c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(356, 100, 30, 640);
      for (const z of g.zones) {
        if (z.type === 'water') { c.fillStyle = 'rgba(120,220,235,.55)'; S.el(c, z.x + z.w / 2, z.y + z.h / 2, z.w / 2 + 6, z.h / 2 + 6); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke(); }
        else if (z.type === 'ice') { c.fillStyle = 'rgba(190,235,255,.6)'; c.beginPath(); c.roundRect(z.x, z.y, z.w, z.h, 14); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(z.x + 20 + i * 34, z.y + 12); c.lineTo(z.x + 6 + i * 34, z.y + 40); c.stroke(); } }
        else if (z.type === 'conv') { c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(z.x, z.y, z.w, z.h); }
      }
      for (const r of g.rails) {
        const sec = r.kind === 'secret'; c.lineCap = 'round'; c.lineJoin = 'round';
        const path = () => { c.beginPath(); r.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
        if (sec) { c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 12; c.setLineDash([2, 12]); path(); c.stroke(); c.setLineDash([]); }
        else { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 17; path(); c.stroke(); c.strokeStyle = r.kind === 'sled' ? '#e8f6ff' : '#ff5c8a'; c.lineWidth = 13; path(); c.stroke(); c.strokeStyle = r.kind === 'sled' ? '#9fd0ee' : '#ffe066'; c.lineWidth = 7; path(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.setLineDash([6, 10]); path(); c.stroke(); c.setLineDash([]); }
        const p = r.pts[0]; c.fillStyle = sec ? 'rgba(20,10,40,.85)' : '#fff'; S.ci(c, p[0], p[1], sec ? 15 : 11); c.fill(); c.strokeStyle = '#ffd24a'; c.lineWidth = 2.5; c.stroke();
      }
      c.restore();
      // 壁
      const wc = (lk.frameC) || th.wall; c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 11; outline(); c.stroke(); c.strokeStyle = wc; c.lineWidth = 8; outline(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; outline(); c.stroke();
      const line = (a, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); c.stroke(); };
      for (const a of [[356, 165, 356, 730], [42, 522, 42, 592, 108, 634], [328, 522, 328, 592, 262, 634], [155, 92, 155, 128], [215, 92, 215, 128], [68.5, 68.5, 98, 94], [356, 702, 386, 702]].concat(g.st.walls || [])) { line(a, 8, 'rgba(0,0,0,.28)'); line(a, 5.5, wc); }
      for (const t of [[70, 502, 70, 570, 102, 596], [300, 502, 300, 570, 268, 596]]) { c.fillStyle = '#fff5d6'; c.strokeStyle = wc; c.lineWidth = 4; c.beginPath(); c.moveTo(t[0], t[1]); c.lineTo(t[2], t[3]); c.lineTo(t[4], t[5]); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ffb3c8'; S.paw(c, (t[0] + t[2] + t[4]) / 3 + (t[0] < 185 ? 2 : -2), (t[1] + t[3] + t[5]) / 3 - 4, 8); }
    }

    // ----- エフェクト -----
    burst(x, y, n, col, sp) { if (this.quality === 'low') n = Math.ceil(n / 3); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (sp || 120) * (0.4 + Math.random()); if (this.parts.length < 160) this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0.5 + Math.random() * 0.4, r: 3 + Math.random() * 3, col: col || '#ffe066', rot: Math.random() * 6 }); } }
    pop(x, y, txt, big) { if (this.pops.length > 14) this.pops.shift(); this.pops.push({ x, y, txt, t: big ? 1.1 : 0.7, big }); }
    banner(title, desc, kind) { if (this.banners.length > 3) this.banners.splice(1, 1); this.banners.push({ title, desc, t: kind === 'hint' ? 3.2 : 2.2, kind }); }
    fly(n, fur) { for (let i = 0; i < n; i++) this.flyers.push({ x: -40 - Math.random() * 300, y: 80 + Math.random() * 520, v: 260 + Math.random() * 240, r: 16 + Math.random() * 16, rot: Math.random() * 6, fur: fur || ['fawn', 'black', 'white', 'apricot', 'silver'][i % 5] }); }
    flip(i) { const v = this.vis[i]; if (i === 0) { v.str = 0.12; v.curlV = 14; } else { v.wobT = 0.35; } }

    draw(dt) {
      const g = this.g, c = this.c; if (!g) return; this.t += dt; const t = this.t;
      if (!this.stat) this.buildStatic();
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.stat, 0, 0);
      const k = this.sc * this.dpr; let sx = 0, sy = 0; if (this.shake > 0) { this.shake -= dt; sx = (Math.random() - 0.5) * 5; sy = (Math.random() - 0.5) * 5; }
      c.setTransform(k, 0, 0, k, (this.ox + sx * this.sc) * this.dpr, (this.oy + (HUD + sy) * this.sc) * this.dpr);
      const lk = this.look; c.lineCap = 'round'; c.textAlign = 'center'; c.textBaseline = 'middle';
      // ゾーンの動き
      for (const z of g.zones) {
        if (z.type === 'conv') { const d = z.alt ? (Math.sin(g.t * Math.PI / z.alt) >= 0 ? 1 : -1) : 1; c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 7; i++) { const x = z.x + ((i * 52 + d * g.t * 90) % z.w + z.w) % z.w, y = z.y + z.h / 2; c.beginPath(); c.moveTo(x + d * 8, y); c.lineTo(x - d * 5, y - 7); c.lineTo(x - d * 5, y + 7); c.fill(); } }
        else if (z.type === 'water' && this.quality !== 'low') { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const ph = (t * 0.4 + i * 0.25) % 1, x = z.x + 30 + i * 40; c.globalAlpha = 1 - ph; c.beginPath(); c.moveTo(x, z.y - ph * 40); c.quadraticCurveTo(x + 8, z.y - 10 - ph * 40, x, z.y - 20 - ph * 40); c.stroke(); } c.globalAlpha = 1; }
      }
      // レーンのゲート
      for (const q of g.gates) {
        const on = q.kind === 'pug' ? g.lit[q.i] : q.hitT > 0;
        if (q.kind === 'pug') { c.fillStyle = on ? '#ffe14a' : 'rgba(255,255,255,.35)'; S.ci(c, q.x, q.y, 11); c.fill(); c.strokeStyle = on ? '#ff8a00' : 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.stroke(); c.fillStyle = on ? '#b3261e' : 'rgba(0,0,0,.45)'; c.font = 'bold 12px ' + FONT; c.fillText('PUG'[q.i], q.x, q.y + 0.5); }
        else { c.fillStyle = on ? '#fff' : '#ff9ec4'; S.paw(c, q.x, q.y, 12); c.fillStyle = '#fff'; c.font = 'bold 8px ' + FONT; c.fillText('1000', q.x, q.y + 17); }
      }
      // 穴
      for (const h of g.holes) {
        const jp = g.jackpotLit; c.fillStyle = '#1a1020'; S.ci(c, h.x, h.y, 14); c.fill(); c.strokeStyle = jp ? (Math.sin(t * 10) > 0 ? '#ffe14a' : '#ff5c8a') : h.kind === 'warp' ? '#9d7bff' : '#8a5a3a'; c.lineWidth = jp ? 4 : 3; c.stroke();
        if (h.kind === 'warp' || h.kind === 'tunnel') { c.strokeStyle = h.kind === 'warp' ? '#c9b3ff' : '#7fe3f0'; c.lineWidth = 2; c.beginPath(); c.arc(h.x, h.y, 8, t * 4, t * 4 + 4); c.stroke(); }
        else { c.fillStyle = '#c9814f'; c.beginPath(); c.moveTo(h.x - 17, h.y - 9); c.lineTo(h.x, h.y - 24); c.lineTo(h.x + 17, h.y - 9); c.closePath(); c.fill(); }
        if (jp) { c.fillStyle = '#ffe14a'; c.font = 'bold 9px ' + FONT; c.fillText('JACKPOT', h.x, h.y + 23); }
      }
      for (const s of g.spinners) { c.save(); c.translate(s.x, s.y); c.scale(Math.cos(s.ang) || 0.05, 1); c.drawImage(PP.pugSprite('fawn', s.spin > 2 ? 'surprised' : 'normal'), -14, -14, 28, 28); c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x, s.y - 17); c.lineTo(s.x, s.y + 17); c.stroke(); }
      for (const f of g.foods) { const a = f.t < 3 ? (Math.sin(t * 16) > 0 ? 1 : 0.3) : 1; c.globalAlpha = a; c.fillStyle = '#b8742f'; S.ci(c, f.x, f.y + Math.sin(t * 4 + f.x) * 2, 7); c.fill(); c.fillStyle = '#ffe1b8'; S.bone(c, f.x, f.y + Math.sin(t * 4 + f.x) * 2, 6, 2.4); c.globalAlpha = 1; }
      for (const tg of g.targets) PP.drawTarget(c, tg, t);
      for (const d of g.doors) if (d.on) { c.strokeStyle = '#ffd24a'; c.lineWidth = 5; c.beginPath(); c.moveTo(d.x1, d.y1); c.lineTo(d.x2, d.y2); c.stroke(); }
      if (g.st.door && g.doors.length && !g.doors[0].on) { c.fillStyle = Math.sin(t * 8) > 0 ? '#ffe14a' : '#fff'; c.font = 'bold 11px ' + FONT; c.fillText('▼ここ！', 185, 196); }
      for (const m of g.bumpers) if (m.on) PP.drawBumper(c, m, g.t, lk.bumper);
      const boss = g.bossB; if (boss && boss.on) { c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.roundRect(boss.x - 34, boss.y - 54, 68, 7, 3.5); c.fill(); c.fillStyle = '#ff4d6d'; c.beginPath(); c.roundRect(boss.x - 33, boss.y - 53, 66 * boss.hp / boss.hpMax, 5, 2.5); c.fill(); }
      for (const s of g.slings) if (s.hitT > 0) { c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke(); }
      // ボールセーブ表示
      if (g.save > 0 || g.bonusTime > 0) { c.fillStyle = Math.sin(t * 6) > 0 ? '#7CFC9A' : '#4bd17a'; S.paw(c, 185, 672, 11); }
      // しっぽフリッパー
      for (let i = 0; i < 2; i++) { const v = this.vis[i]; if (v.str) v.str = Math.max(0, v.str - dt * 0.6); if (v.curlV) { v.curl = (v.curl || 0) + v.curlV * dt; v.curlV = Math.max(0, v.curlV - dt * 30); } if (v.wobT > 0) { v.wobT -= dt; v.wob = Math.sin(v.wobT * 40) * 0.12 * (v.wobT / 0.35); } else v.wob = 0; PP.drawTail(c, g.flips[i], lk.flip, v, t); }
      // ボール
      const skin = lk.ball;
      for (const b of g.balls) {
        if (b.held && b.held.hole) continue;
        const vr = b.r > 12 ? b.r * 1.3 : b.r;
        if (this.quality !== 'low' && b.trail && !b.inShooter) { for (let i = 0; i < b.trail.length; i += 2) { c.globalAlpha = 0.05 + i / b.trail.length * 0.18; c.fillStyle = g.fever > 0 ? `hsl(${(t * 300 + i * 20) % 360},90%,70%)` : '#fff'; S.ci(c, b.trail[i], b.trail[i + 1], vr * (0.4 + i / b.trail.length * 0.5)); c.fill(); } c.globalAlpha = 1; }
        
        c.save(); c.translate(b.x, b.y); c.fillStyle = 'rgba(0,0,0,.2)'; S.el(c, 2, 3, vr, vr); c.fill(); const sp = PP.ballSprite(skin), d = vr * 2.5; c.drawImage(sp, -d / 2, -d / 2, d, d); c.restore();
      }
      // パーティクル
      const ef = lk.effect;
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i]; p.t -= dt; if (p.t <= 0) { this.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; c.globalAlpha = Math.min(1, p.t * 2.5); c.fillStyle = p.col;
        if (ef === 'heart') { S.heart(c, p.x, p.y, p.r); c.fill(); } else if (ef === 'paw') S.paw(c, p.x, p.y, p.r * 1.2); else if (ef === 'bone') S.bone(c, p.x, p.y, p.r * 2, p.r * 0.7); else { S.star(c, p.x, p.y, p.r * 1.2); c.fill(); }
      }
      c.globalAlpha = 1;
      for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i]; p.t -= dt; if (p.t <= 0) { this.pops.splice(i, 1); continue; } p.y -= 40 * dt; c.globalAlpha = Math.min(1, p.t * 3); c.font = `bold ${p.big ? 17 : 11}px ${FONT}`; c.lineWidth = 3; c.strokeStyle = 'rgba(40,20,60,.85)'; c.strokeText(p.txt, p.x, p.y); c.fillStyle = p.big ? '#ffe14a' : '#fff'; c.fillText(p.txt, p.x, p.y); }
      c.globalAlpha = 1;
      // フィーバー・大集合の演出
      if (g.fever > 0) { c.strokeStyle = `hsl(${(t * 200) % 360},95%,65%)`; c.lineWidth = 6; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(17, 720); c.lineTo(17, 200); c.arc(200, 200, 183, Math.PI, TAU); c.lineTo(383, 720); c.stroke(); c.globalAlpha = 1; for (let i = 0; i < 6; i++) { const y = 230 + i * 50, bob = Math.sin(t * 6 + i) * 6, L = i % 2 === 0; c.drawImage(PP.pugSprite(['fawn', 'black', 'white'][i % 3], 'happy'), (L ? 4 : 326) + (L ? bob : -bob), y - 20, 40, 40); } }
      if (g.gather > 0) for (let i = 0; i < 7; i++) { const x = ((t * 60 + i * 55) % 400) - 20; c.drawImage(PP.pugSprite(['fawn', 'apricot', 'silver', 'black', 'white'][i % 5], 'happy'), x, 62 + Math.sin(t * 8 + i) * 4, 30, 30); }
      for (let i = this.flyers.length - 1; i >= 0; i--) { const f = this.flyers[i]; f.x += f.v * dt; f.rot += dt * 5; if (f.x > 460) { this.flyers.splice(i, 1); continue; } c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.globalAlpha = 0.85; c.drawImage(PP.pugSprite(f.fur, 'happy'), -f.r * 1.25, -f.r * 1.25, f.r * 2.5, f.r * 2.5); c.restore(); }
      c.globalAlpha = 1;
      // コンボ表示
      if (g.combo >= 2) { const m = g.combo >= 5 ? 3 : g.combo >= 3 ? 2 : 1.5, a = Math.min(1, g.comboT / 0.4); c.globalAlpha = a; c.font = `bold ${Math.min(26, 15 + g.combo * 0.5)}px ${FONT}`; c.lineWidth = 4; c.strokeStyle = '#5a1a4a'; const s = g.combo + ' COMBO ×' + m; c.strokeText(s, 185, 510); c.fillStyle = g.combo >= 5 ? '#ffe14a' : '#fff'; c.fillText(s, 185, 510); c.globalAlpha = 1; }
      // モード表示（フリッパー下の空きスペース）
      const chips = []; if (g.fever > 0) chips.push(['FEVER ' + Math.ceil(g.fever), '#ff5c8a']); if (g.giant > 0) chips.push(['巨大 ' + Math.ceil(g.giant), '#ff9f43']); if (g.rush > 0) chips.push(['肉球×3 ' + Math.ceil(g.rush), '#e0569b']); if (g.gather > 0) chips.push(['大集合×2 ' + Math.ceil(g.gather), '#7c6cf0']); if (g.bonusTime > 0) chips.push(['ボーナス ' + Math.ceil(g.bonusTime), '#2fb36a']); else if (g.save > 0 && g.phase === 'play') chips.push(['セーブ ' + Math.ceil(g.save), '#2fb36a']);
      if (g.st.grav) chips.push([g.gy < 0.6 ? '低重力' : g.gx ? '横重力' : '重力ふつう', '#5b6ee1']);
      c.font = 'bold 10px ' + FONT; let cx = 185 - chips.length * 35 + 35; for (const ch of chips) { c.fillStyle = ch[1]; c.beginPath(); c.roundRect(cx - 33, 698, 66, 16, 8); c.fill(); c.fillStyle = '#fff'; c.fillText(ch[0], cx, 706.5); cx += 70; }
      // 発射ボタン
      if (g.phase === 'ready' && !g.over && !(this.tut && this.tut.step < 3)) {
        const pu = 1 + Math.sin(t * 6) * 0.06; c.save(); c.translate(371, 630); c.scale(pu, pu); c.fillStyle = '#ff5c8a'; S.ci(c, 0, 0, 21); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#fff'; c.font = 'bold 12px ' + FONT; c.fillText('発射', 0, 0.5); c.restore();
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.roundRect(363, 470, 16, 130, 8); c.fill(); if (this.charge >= 0) { const hgt = 126 * this.charge; c.fillStyle = `hsl(${120 - this.charge * 120},90%,60%)`; c.beginPath(); c.roundRect(365, 598 - hgt, 12, hgt, 6); c.fill(); }
        c.fillStyle = '#fff'; c.font = 'bold 9px ' + FONT; c.fillText('長押しで', 371, 448); c.fillText('パワー', 371, 459);
      }
      if (this.tut) this.drawTut(c, t);
      // バナー
      if (this.banners.length) {
        const b = this.banners[0]; b.t -= dt; const a = Math.min(1, b.t * 4, (b.kind === 'hint' ? 3.2 : 2.2) - b.t > 0.15 ? 1 : 0.5); c.globalAlpha = Math.max(0, a); const hint = b.kind === 'hint';
        c.font = `bold ${hint ? 11 : 15}px ${FONT}`; const w = Math.min(350, Math.max(c.measureText(b.title).width, b.desc ? c.measureText(b.desc).width * 0.75 : 0) + 34), hh = b.desc ? 40 : 28, y = hint ? 150 : 56;
        c.fillStyle = hint ? 'rgba(30,60,110,.9)' : 'rgba(90,20,70,.92)'; c.beginPath(); c.roundRect(185 - w / 2, y - hh / 2, w, hh, 14); c.fill(); c.strokeStyle = hint ? '#9fd0ff' : '#ffe14a'; c.lineWidth = 2; c.stroke();
        c.fillStyle = hint ? '#fff' : '#ffe14a'; c.fillText(b.title, 185, b.desc ? y - 8 : y + 0.5); if (b.desc) { c.fillStyle = '#fff'; c.font = '10px ' + FONT; c.fillText(b.desc, 185, y + 10); }
        c.globalAlpha = 1; if (b.t <= 0) this.banners.shift();
      }
      this.drawHud(c, t, dt);
    }

    drawHud(c, t, dt) {
      const g = this.g, lk = this.look; c.setTransform(this.sc * this.dpr, 0, 0, this.sc * this.dpr, this.ox * this.dpr, this.oy * this.dpr);
      c.fillStyle = 'rgba(20,12,36,.92)'; c.beginPath(); c.roundRect(4, 3, 392, HUD - 6, 12); c.fill();
      if (this.moodT > 0) this.moodT -= dt; const mood = this.moodT > 0 ? this.mood : g.fever > 0 ? 'star' : g.combo >= 3 ? 'happy' : 'normal';
      const bob = mood === 'happy' || mood === 'star' ? Math.abs(Math.sin(t * 10)) * 3 : 0; c.drawImage(PP.pugSprite(lk.pug.fur, mood, lk.pug.acc, 96), 5, 1 - bob, 44, 44);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff'; c.font = 'bold 20px ' + FONT; c.fillText(g.score.toLocaleString(), 52, 24);
      c.font = '9.5px ' + FONT; const m = g.missions.find(x => !x.done); c.fillStyle = g.cleared ? '#7CFC9A' : '#ffd9ec';
      c.fillText(g.cleared ? '★ クリア済み！スコアをのばそう' : m ? `目標 ${g.missions.filter(x => x.done).length + 1}/${g.missions.length}：${m.t}（${m.k === 'score' ? Math.floor(m.p / m.n * 100) + '%' : m.p + '/' + m.n}）` : '', 52, 37);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const n = Math.max(0, g.ballsLeft - (g.over ? 0 : 1)); for (let i = 0; i < Math.min(n, 5); i++) c.drawImage(PP.ballSprite(lk.ball), 330 - i * 17, 6, 20, 20);
      c.fillStyle = '#bcaedc'; c.font = '8px ' + FONT; c.fillText('のこり', 305 - Math.min(n, 5) * 8, 33);
      c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.roundRect(358, 8, 32, 30, 9); c.fill(); c.fillStyle = '#fff'; c.fillRect(368, 15, 4, 16); c.fillRect(376, 15, 4, 16);
    }

    drawTut(c, t) {
      const s = this.tut.step, pu = 0.5 + Math.sin(t * 5) * 0.25; c.font = 'bold 17px ' + FONT;
      const zone = (x, w, txt) => { c.fillStyle = `rgba(255,225,74,${0.18 + pu * 0.2})`; c.beginPath(); c.roundRect(x, 420, w, 290, 18); c.fill(); c.strokeStyle = '#ffe14a'; c.lineWidth = 3; c.setLineDash([8, 8]); c.stroke(); c.setLineDash([]); const hx = x + w / 2, hy = 560 + Math.sin(t * 5) * 8; c.fillStyle = '#fff'; S.ci(c, hx, hy, 15); c.fill(); c.strokeStyle = '#ff5c8a'; c.lineWidth = 4; S.ci(c, hx, hy, 15 + pu * 16); c.stroke(); c.fillStyle = '#ff5c8a'; c.font = 'bold 13px ' + FONT; c.fillText('タップ', hx, hy + 0.5); };
      if (s === 0) zone(8, 180, ''); else if (s === 1) zone(196, 180, ''); else if (s === 2) { zone(8, 180, ''); zone(196, 180, ''); }
      else if (s === 3) { c.strokeStyle = '#ffe14a'; c.lineWidth = 4; S.ci(c, 371, 630, 26 + pu * 10); c.stroke(); }
      const txt = ['ひだり側をタップ！', 'みぎ側をタップ！', '左右いっしょにタップ！', '発射ボタンを長押し→はなす！', 'じょうず！しっぽでボールをはじこう'][s], sub = ['左のしっぽが動くよ', '右のしっぽが動くよ', '両方のしっぽが動くよ', '長く押すほど強く飛ぶ', ''][s];
      c.font = 'bold 17px ' + FONT; const w = c.measureText(txt).width + 36; c.fillStyle = 'rgba(40,20,70,.93)'; c.beginPath(); c.roundRect(185 - w / 2, 340, w, sub ? 56 : 40, 16); c.fill(); c.strokeStyle = '#ffe14a'; c.lineWidth = 2.5; c.stroke(); c.fillStyle = '#fff'; c.fillText(txt, 185, sub ? 360 : 361); if (sub) { c.font = '11px ' + FONT; c.fillStyle = '#ffd9ec'; c.fillText(sub, 185, 381); }
    }
  }
  PP.Renderer = Renderer; PP.HUD = HUD; PP.FONT = FONT;
})();
