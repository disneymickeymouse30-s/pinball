/* PUG PINBALL WORLD - ゲームロジックと物理演算（DOM非依存） */
var PP = (typeof window !== 'undefined' ? window : globalThis).PP = ((typeof window !== 'undefined' ? window : globalThis).PP || {});
(function () {
  'use strict';
  const TW = 400, TH = 720, BR = 11, SUB = 1 / 480, FL = 56;
  // 調整用パラメータ（ここを変えるとゲーム全体の手ざわりが変わる）
  const TUNE = PP.TUNE = { gravity: 1000, maxSpeed: 1500, flipUp: 26, flipDown: 15, flipE: 0.32, bumperKick: 520, slingKick: 430, comboTime: 1.3, feverTime: 12, launchMin: 1240, launchAdd: 200 };
  const BSCORE = { paw: 100, face: 200, butt: 150, cushion: 100, food: 150, shisa: 250, planet: 200, fish: 150, candy: 150, snow: 100, manju: 150, bowl: 100, plush: 150, eel: 300, boss: 500, gold: 300, chest: 200 };
  const BKICK = { cushion: 400, bowl: 330, eel: 340, boss: 600 };

  function mkseg(x1, y1, x2, y2, o) {
    const s = Object.assign({ x1, y1, x2, y2, e: 0.35, w: 0, kick: 0, kind: 'wall', on: true }, o || {});
    s.dx = x2 - x1; s.dy = y2 - y1; s.l2 = s.dx * s.dx + s.dy * s.dy;
    const L = Math.sqrt(s.l2) || 1; s.nx = -s.dy / L; s.ny = s.dx / L;
    const m = 22 + s.w;
    s.minx = Math.min(x1, x2) - m; s.maxx = Math.max(x1, x2) + m; s.miny = Math.min(y1, y2) - m; s.maxy = Math.max(y1, y2) + m;
    return s;
  }

  class Game {
    constructor(stage, emit, opt) {
      this.st = stage; this.emit = emit || function () { }; this.opt = opt || {};
      this.rng = this.opt.rng || Math.random;
      this.ph = Object.assign({ g: TUNE.gravity, damp: 0.04, wallE: 0.35, kick: 1 }, stage.phys || {});
      this.score = 0; this.ballsLeft = 3; this.combo = 0; this.comboT = 0; this.maxCombo = 0;
      this.fever = 0; this.giant = 0; this.rush = 0; this.gather = 0; this.bonusTime = 0; this.save = 0;
      this.cnt = {}; this.cleared = false; this.over = false; this.t = 0; this.acc = 0; this.balls = [];
      this.phase = 'ready'; this.jackpotLit = false; this.bankN = 0; this.extra = 0; this.extraScore = false; this.bow = 0;
      this.lit = [0, 0, 0]; this.pugN = 0; this.foods = []; this.gp = 0; this.gpT = 0; this.gx = 0; this.gy = 1;
      this.nid = 1; this.bumpHits = 0; this.secretC = 0; this.secretT = -9; this.secretFound = false;
      this.autoT = 0; this.fresh = true; this.wallImp = 0; this.hinted = {}; this.nudges = 0; this.oob = 0; this.foodT = 3;
      this.feverCool = 0; this.lastHit = null; this.locked = false; // チュートリアル中は発射を止める
      this.build();
      if (stage.grav) { this.gx = stage.grav[0].gx; this.gy = stage.grav[0].gy; }
      this.spawnShooter(false);
    }

    build() {
      const st = this.st, S = this.segs = [], E = this.ph.wallE;
      const add = (a, o) => { for (let i = 0; i + 3 < a.length; i += 2) S.push(mkseg(a[i], a[i + 1], a[i + 2], a[i + 3], o)); };
      const arc = []; for (let i = 0; i <= 32; i++) { const an = Math.PI + Math.PI * i / 32; arc.push(200 + 186 * Math.cos(an), 200 + 186 * Math.sin(an)); }
      add(arc, { e: 0.2 });
      add([14, 200, 14, 760], { e: E }); add([386, 200, 386, 760], { e: E }); add([356, 165, 356, 760], { e: E });
      add([356, 702, 386, 702], { e: 0.1 });
      S.push(mkseg(356, 165, 356, 97, { e: E, kind: 'oneway' }));
      add([42, 522, 42, 592, 108, 634], { e: 0.2 }); add([328, 522, 328, 592, 262, 634], { e: 0.2 });
      add([70, 502, 70, 570, 102, 596], { e: E }); add([300, 502, 300, 570, 268, 596], { e: E });
      S.push(mkseg(70, 502, 102, 596, { e: 0.3, kick: TUNE.slingKick, kind: 'sling', hitT: 0 }));
      S.push(mkseg(300, 502, 268, 596, { e: 0.3, kick: TUNE.slingKick, kind: 'sling', hitT: 0 }));
      this.slings = S.filter(s => s.kind === 'sling');
      add([68.5, 68.5, 98, 94], { e: 0.3, w: 2, deco: 1 }); // 発射したボールをP・U・Gレーンへ落とすガイド
      add([155, 92, 155, 128], { e: E, w: 3 }); add([215, 92, 215, 128], { e: E, w: 3 });
      (st.walls || []).forEach(w => add(w, { e: E, w: 2, deco: 1 }));
      this.doors = []; (st.doors || []).forEach(w => { const s = mkseg(w[0], w[1], w[2], w[3], { e: E, w: 2, kind: 'door' }); S.push(s); this.doors.push(s); });
      this.targets = (st.targets || []).map(a => {
        const peg = a[0] === a[2] && a[1] === a[3];
        const t = { kind: a[4], group: a[5], seq: a[6] || 0, down: false, hitT: 0, peg, x: (a[0] + a[2]) / 2, y: (a[1] + a[3]) / 2 };
        t.seg = mkseg(a[0], a[1], a[2], a[3], { e: 0.4, w: peg ? 8 : 3, kind: 'target', ref: t }); S.push(t.seg); return t;
      });
      this.bumpers = (st.bumpers || []).map(a => {
        const o = a[4] || {};
        const m = Object.assign({ x: a[0], y: a[1], r: a[2], kind: a[3], score: BSCORE[a[3]] || 100, on: true, up: true, hitT: 0, cool: 0, kick: BKICK[a[3]] || TUNE.bumperKick, rise: 1 }, o);
        if (m.boss) { m.hp = m.boss; m.hpMax = m.boss; }
        if (m.guard) m.on = false;
        return m;
      });
      this.bossB = this.bumpers.find(m => m.boss) || null;
      this.gates = st.noLanes ? [] : [{ x: 125, y: 112, kind: 'pug', i: 0, cool: 0 }, { x: 185, y: 106, kind: 'pug', i: 1, cool: 0 }, { x: 245, y: 112, kind: 'pug', i: 2, cool: 0 }];
      (st.gates || []).forEach(g => this.gates.push({ x: g[0], y: g[1], kind: g[2], cool: 0, hitT: 0 }));
      this.holes = (st.holes || []).map(h => ({ x: h[0], y: h[1], r: 15, kind: h[2], to: h[3], ovx: h[4], ovy: h[5], cool: 0 }));
      this.rails = (st.rails || []).map(r => {
        const o = Object.assign({ cool: 0, cap: 17 }, r); o.cum = [0];
        for (let i = 1; i < o.pts.length; i++) o.cum.push(o.cum[i - 1] + Math.hypot(o.pts[i][0] - o.pts[i - 1][0], o.pts[i][1] - o.pts[i - 1][1]));
        o.len = o.cum[o.cum.length - 1]; return o;
      });
      this.spinners = (st.spinners || []).map(s => ({ x: s[0], y: s[1], cool: 0, spin: 0, ang: 0 }));
      this.zones = st.zones || [];
      this.flips = [{ px: 112, py: 638, rest: 0.5, act: -0.55, a: 0.5, w: 0, on: false, c: 1, s: 0, side: 0 },
      { px: 258, py: 638, rest: Math.PI - 0.5, act: Math.PI + 0.55, a: Math.PI - 0.5, w: 0, on: false, c: -1, s: 0, side: 1 }];
      this.missions = (st.missions || []).map(m => Object.assign({ done: false, p: 0 }, m));
      this.bankReset = {};
    }

    // ---------- ボール ----------
    newBall(x, y, vx, vy) { const b = { id: this.nid++, x, y, vx: vx || 0, vy: vy || 0, r: this.giant > 0 ? 13.5 : BR, ang: 0, held: null, launching: false, inShooter: false, ex: null, exT: 0, sx: x, sy: y, st: 0, trail: [] }; this.balls.push(b); return b; }
    spawnShooter(auto) { const b = this.newBall(371, 690, 0, 0); b.inShooter = true; if (auto) this.autoT = 0.7; else if (this.balls.length === 1) this.phase = 'ready'; return b; }
    launch(p) {
      if (this.locked || this.over) return false; let any = false;
      for (const b of this.balls) if (b.inShooter) { b.inShooter = false; b.launching = true; b.x = 371; b.y = 688; b.vx = 0; b.vy = -(TUNE.launchMin + Math.max(0, Math.min(1, p)) * TUNE.launchAdd); any = true; }
      if (any) { this.phase = 'play'; if (this.fresh) { this.save = Math.max(this.save, this.st.saveTime || 10); this.fresh = false; } this.emit('launch'); }
      return any;
    }
    addBalls(n) { const pos = [[150, 150], [220, 150], [185, 140]]; for (let i = 0; i < n && this.balls.length < 5; i++) { const p = pos[i % 3]; this.newBall(p[0], p[1], (this.rng() - 0.5) * 160, 60); } }
    setFlip(i, on) { const f = this.flips[i]; if (f.on === on) return; f.on = on; if (on && !this.over) this.emit('flip', i); }

    // ---------- 得点・コンボ ----------
    inc(k, n) { this.cnt[k] = (this.cnt[k] || 0) + (n || 1); }
    mult() { const c = this.combo; let m = c >= 5 ? 3 : c >= 3 ? 2 : c >= 2 ? 1.5 : 1; if (this.fever > 0 || this.giant > 0 || this.gather > 0) m *= 2; return m; }
    addScore(base, x, y, raw) {
      const pts = Math.round(base * (raw ? 1 : this.mult())); this.score += pts;
      this.emit('score', { pts, x, y, big: pts >= 1000 });
      if (pts >= 500) for (const b of this.balls) { b.ex = 'happy'; b.exT = 0.8; }
      if (!this.extraScore && this.score >= (this.st.extraAt || 150000)) { this.extraScore = true; this.giveExtra(); }
      return pts;
    }
    hit() {
      if (this.comboT > 0) this.combo++; else this.combo = 1; this.comboT = TUNE.comboTime;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      if (this.combo === 5) this.inc('combo5');
      if (this.combo >= 2) this.emit('combo', this.combo);
      if (this.combo === 2) this.hint('combo');
      if (this.combo >= 10 && this.fever <= 0 && this.feverCool <= 0) this.startFever();
    }
    hint(k) { if (!this.hinted[k]) { this.hinted[k] = 1; this.emit('hint', k); } }
    ev(id, title, desc) { this.emit('event', { id, title, desc }); }
    giveExtra() { if (this.extra >= 2) return; this.extra++; this.ballsLeft++; this.ev('extra', 'エクストラボール！', '残りボール +1'); }
    startFever() { this.fever = TUNE.feverTime; this.inc('fever'); this.addBalls(2); this.ev('fever', 'パグフィーバー！！', '12秒間 得点2倍＋ボール増殖'); }
    multiball() { this.addBalls(2); this.inc('multiball'); this.ev('multiball', 'マルチボール！', 'ボールが増えた'); }
    spawnFoods(n) {
      for (let i = 0; i < n; i++) for (let k = 0; k < 20; k++) {
        const x = 45 + this.rng() * 280, y = 150 + this.rng() * 320;
        if (this.bumpers.every(m => Math.hypot(m.x - x, m.y - y) > m.r + 14)) { this.foods.push({ x, y, t: 12 }); break; }
      }
    }

    bumperHit(m, b, imp) {
      if (m.cool > 0) return; m.cool = 0.07; m.hitT = 0.25; const prev = this.lastHit; this.lastHit = m;
      this.inc('bumper'); if (m.kind === 'paw' || m.kind === 'gold') this.inc('paw'); if (m.kind === 'eel') { this.inc('eel'); this.hint('eel'); } else this.hint(m.boss ? 'boss' : 'bumper');
      this.bumpHits++; this.hit();
      this.addScore(m.score * (this.rush > 0 ? 3 : 1), m.x, m.y);
      this.emit('bumper', { k: m.kind, x: m.x, y: m.y, v: imp });
      if (imp > 650) { b.ex = 'surprised'; b.exT = 0.5; }
      if (this.bumpHits % 25 === 0 && this.rush <= 0) { this.rush = 12; this.ev('rush', '肉球ラッシュ！', '12秒間 バンパー得点3倍'); }
      if (m.grow) { m.r += m.grow[2]; if (m.r >= m.grow[1]) { m.r = m.grow[0]; this.inc('burst'); this.addScore(1500, m.x, m.y); this.emit('burst', m); this.ev('burst', '雪玉がわれた！', '+1,500点'); } }
      if (m.boss) {
        m.hp--; this.emit('bossHit', m);
        if (m.hp === Math.floor(m.hpMax / 2)) { for (const g of this.bumpers) if (g.guard) g.on = true; this.ev('boss2', '王様が本気を出した！', '肉球ガードが出現'); }
        if (m.hp <= 0) { m.on = false; for (const g of this.bumpers) if (g.guard) g.on = false; this.inc('boss'); this.addScore(50000, m.x, m.y, true); this.inc('superjp'); this.inc('jackpot'); this.ev('bossDown', '王様パグを倒した！', 'スーパージャックポット 50,000点'); this.emit('bossDown', m); }
      }
      if (m.secret) {
        if (prev === m && this.t - this.secretT < 4) this.secretC++; else this.secretC = 1; this.secretT = this.t;
        if (this.secretC >= 3 && !this.secretFound) { this.secretFound = true; this.inc('secret'); this.addScore(3000, m.x, m.y, true); this.bow += 20; this.spawnFoods(8); this.ev('secret', '隠しイベント発見！', '+3,000点 ＋20バウ'); this.emit('secret'); }
      }
    }
    targetHit(t, b) {
      if (t.down) return; this.hint('target'); this.lastHit = t;
      const st = this.st, grp = this.targets.filter(x => x.group === t.group);
      if (st.ordered) {
        const next = Math.min.apply(null, grp.filter(x => !x.down).map(x => x.seq));
        if (t.seq !== next) { t.hitT = 0.2; if (this.t - (this.seqT || -9) > 2) { this.seqT = this.t; this.emit('seqfail'); this.ev('seqfail', 'まだ光っていない！', '次は ' + next + ' 番をねらおう'); } return; }
      }
      t.down = true; t.seg.on = false; t.hitT = 0.3; this.inc('target'); this.hit(); this.addScore(300, t.x, t.y); this.emit('target', t);
      if (grp.every(x => x.down)) {
        this.inc('bank'); this.bankN++; this.addScore(500 * grp.length, t.x, t.y); this.jackpotLit = true; this.emit('bank');
        if (st.door) { this.doors.forEach(d => d.on = false); this.rails.forEach(r => r.locked = false); this.doorT = 0; this.ev('door', '隠し扉が開いた！', '中央のつぼに上から飛びこめ'); }
        else { this.ev('bank', 'ターゲットコンプリート！', 'ジャックポット点灯。穴をねらえ'); this.bankReset[t.group] = 1.5; if (this.bankN % 3 === 0) this.multiball(); }
      }
    }
    closeDoor() { this.doorT = 0; this.doors.forEach(d => d.on = true); this.rails.forEach(r => { if (this.st.door) r.locked = true; }); this.targets.forEach(x => { x.down = false; x.seg.on = true; }); }
    gateHit(g, b) {
      g.cool = 0.5; g.hitT = 0.3; this.lastHit = g;
      if (g.kind === 'pug') {
        this.hint('gate'); this.hit(); this.addScore(200, g.x, g.y); this.lit[g.i] = 1; this.emit('gate', g);
        if (this.lit[0] && this.lit[1] && this.lit[2]) { this.lit = [0, 0, 0]; this.pugN++; this.gather = 12; this.addScore(3000, 185, 130, true); this.bow += 10; this.inc('gather'); this.ev('gather', 'パグ大集合！', '+3,000点＋12秒間 得点2倍'); if (this.pugN === 2) this.giveExtra(); }
      } else { this.hint('bonus'); this.inc('gate'); this.hit(); this.addScore(1000, g.x, g.y); this.emit('gate', g); }
    }
    holeIn(h, b) {
      b.held = { hole: h, t: 0.9 }; b.x = h.x; b.y = h.y; b.vx = b.vy = 0; h.cool = 2.5;
      this.lastHit = h; this.inc('hole'); this.hint('hole'); this.hit(); this.addScore(500, h.x, h.y); this.emit('hole', h);
      if (this.jackpotLit) this.jackpot(h.x, h.y);
      else if (h.to == null) {
        const r = this.rng();
        if (r < 0.3 && this.giant <= 0) { this.giant = 15; this.ev('giant', '巨大ボール！', '15秒間 大きくなって得点2倍'); }
        else if (r < 0.62) { this.spawnFoods(10); this.ev('food', 'ドッグフードボーナス！', 'フードを拾って得点とバウ'); }
        else if (r < 0.85) { this.addScore(1000, h.x, h.y - 20, true); this.ev('r1000', 'ルーレット +1,000点', ''); }
        else { this.bow += 5; this.ev('rbow', 'ルーレット +5バウ', ''); }
      }
    }
    jackpot(x, y) {
      const sup = this.balls.length > 1; this.jackpotLit = false; this.inc('jackpot'); if (sup) this.inc('superjp');
      this.addScore(sup ? 15000 : 5000, x, y - 20, true); this.ev(sup ? 'sjp' : 'jp', sup ? 'スーパージャックポット！！' : 'ジャックポット！', sup ? '+15,000点' : '+5,000点'); this.emit('jackpot', sup);
    }
    railDone(r, b) {
      this.inc('rail'); this.hit(); this.addScore(r.score || 1000, b.x, b.y); this.emit('railEnd', r);
      if (r.jackpot) { this.inc('route'); this.jackpotLit = true; this.jackpot(b.x, b.y); this.closeDoor(); }
    }

    // ---------- 進行 ----------
    endModes() { if (this.fever > 0) this.emit('feverEnd'); this.fever = 0; this.giant = 0; this.rush = 0; this.gather = 0; this.combo = 0; this.comboT = 0; }
    allDrained() {
      if (this.save > 0 || this.bonusTime > 0) { this.spawnShooter(true); this.emit('saved'); return; }
      this.ballsLeft--; this.endModes(); this.emit('ballLost', this.ballsLeft);
      if (this.ballsLeft <= 0) { this.over = true; this.phase = 'over'; this.emit('over'); }
      else { this.fresh = true; this.spawnShooter(false); }
    }
    clear() { this.cleared = true; this.bonusTime = 20; this.spawnFoods(12); this.addScore(5000, 185, 300, true); this.emit('clear'); this.ev('clear', 'ステージクリア！', 'ボーナスタイム20秒：落ちても戻ってくる'); }

    update(dt) {
      if (this.over) return; if (dt > 1 / 30) dt = 1 / 30;
      this.frame(dt);
      this.acc += dt; let n = 0;
      while (this.acc >= SUB && n < 20) { this.sub(SUB); this.acc -= SUB; n++; if (this.over) return; }
      if (n === 20) this.acc = 0;
      if (this.wallImp > 0) { this.emit('wall', this.wallImp); this.wallImp = 0; }
    }

    frame(dt) {
      const st = this.st; this.t += dt;
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.emit('comboEnd'); } }
      if (this.feverCool > 0) this.feverCool -= dt;
      if (this.fever > 0) { this.fever -= dt; if (this.fever <= 0) { this.fever = 0; this.feverCool = 20; this.combo = 0; this.comboT = 0; this.emit('feverEnd'); } }
      if (this.giant > 0) this.giant = Math.max(0, this.giant - dt);
      if (this.rush > 0) this.rush = Math.max(0, this.rush - dt);
      if (this.gather > 0) this.gather = Math.max(0, this.gather - dt);
      if (this.bonusTime > 0) this.bonusTime = Math.max(0, this.bonusTime - dt);
      if (this.save > 0 && this.phase === 'play') this.save = Math.max(0, this.save - dt);
      if (this.doorT > 0) { this.doorT -= dt; if (this.doorT <= 0) this.closeDoor(); }
      if (st.grav) { this.gpT += dt; const g = st.grav[this.gp]; if (this.gpT >= g.t) { this.gpT = 0; this.gp = (this.gp + 1) % st.grav.length; const n = st.grav[this.gp]; this.gx = n.gx; this.gy = n.gy; this.hint('grav'); this.ev('grav', n.label, ''); } }
      if (st.foodAlways) { this.foodT -= dt; if (this.foodT <= 0) { this.foodT = 5; if (this.foods.length < 8) this.spawnFoods(3); } }
      for (const k in this.bankReset) { this.bankReset[k] -= dt; if (this.bankReset[k] <= 0) { delete this.bankReset[k]; this.targets.forEach(x => { if (x.group === k) { x.down = false; x.seg.on = true; } }); } }
      for (const s of this.slings) if (s.hitT > 0) s.hitT -= dt;
      for (const t of this.targets) if (t.hitT > 0) t.hitT -= dt;
      for (const g of this.gates) { if (g.cool > 0) g.cool -= dt; if (g.hitT > 0) g.hitT -= dt; }
      for (const h of this.holes) if (h.cool > 0) h.cool -= dt;
      for (const r of this.rails) if (r.cool > 0) r.cool -= dt;
      for (const s of this.spinners) { if (s.cool > 0) s.cool -= dt; if (s.spin > 0.05) { s.ang += s.spin * dt; s.spin *= Math.pow(0.25, dt); } }
      for (let i = this.foods.length - 1; i >= 0; i--) { this.foods[i].t -= dt; if (this.foods[i].t <= 0) this.foods.splice(i, 1); }
      // 動くバンパー
      for (const m of this.bumpers) {
        if (m.cool > 0) m.cool -= dt; if (m.hitT > 0) m.hitT -= dt;
        if (m.orbit) { const o = m.orbit; m.x = o[0] + o[2] * Math.cos(o[3] * this.t + o[4]); m.y = o[1] + o[2] * Math.sin(o[3] * this.t + o[4]); }
        else if (m.slide) { const o = m.slide, k = 0.5 - 0.5 * Math.cos((this.t / o[4] + o[5]) * 2 * Math.PI); m.x = o[0] + (o[2] - o[0]) * k; m.y = o[1] + (o[3] - o[1]) * k; }
        else if (m.guard && this.bossB) { const o = m.guard; m.x = this.bossB.x + o[0] * Math.cos(o[1] * this.t + o[2]); m.y = this.bossB.y + o[0] * Math.sin(o[1] * this.t + o[2]); }
        if (m.eel) { const o = m.eel, fr = ((this.t / o[0] + o[1]) % 1), up = fr < o[2]; m.up = up; m.rise += ((up ? 1 : 0) - m.rise) * Math.min(1, dt * 10); }
      }
      // 保持中のボール（穴・レール）
      for (const b of this.balls) {
        if (b.exT > 0) { b.exT -= dt; if (b.exT <= 0) b.ex = null; }
        const want = this.giant > 0 ? 13.5 : BR; if (b.r !== want) b.r += Math.sign(want - b.r) * Math.min(Math.abs(want - b.r), dt * 20);
        if (b.held) {
          const h = b.held;
          if (h.rail) {
            const r = h.rail; h.d += r.speed * dt; let i = 1; while (i < r.cum.length - 1 && r.cum[i] < h.d) i++;
            const a = r.pts[i - 1], c = r.pts[i], k = Math.max(0, Math.min(1, (h.d - r.cum[i - 1]) / ((r.cum[i] - r.cum[i - 1]) || 1)));
            b.x = a[0] + (c[0] - a[0]) * k; b.y = a[1] + (c[1] - a[1]) * k; b.ang += dt * 8;
            if (h.d >= r.len) { const L = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1; b.vx = (c[0] - a[0]) / L * r.exit; b.vy = (c[1] - a[1]) / L * r.exit; b.held = null; r.cool = 1.2; b.sx = b.x; b.sy = b.y; b.st = 0; this.railDone(r, b); }
          } else {
            h.t -= dt;
            if (h.t <= 0) { let hh = h.hole; if (hh.to != null) hh = this.holes[hh.to]; hh.cool = 1.5; b.x = hh.x; b.y = hh.y; b.vx = hh.ovx + (this.rng() - 0.5) * 80; b.vy = hh.ovy; b.held = null; b.sx = b.x; b.sy = b.y; b.st = 0; this.emit('eject', hh); }
          }
          continue;
        }
        if (b.inShooter) continue;
        // シューターレーンに戻ってきた
        if (b.x > 357 && b.y > 660 && Math.abs(b.vy) < 40 && Math.abs(b.vx) < 40) { b.inShooter = true; b.launching = false; b.x = 371; b.y = 690; b.vx = b.vy = 0; if (this.balls.length === 1) this.phase = 'ready'; else this.autoT = 0.5; continue; }
        // 止まってしまったボールを救出
        if (Math.hypot(b.x - b.sx, b.y - b.sy) > 25) { b.sx = b.x; b.sy = b.y; b.st = 0; }
        else {
          b.st += dt; const cradle = b.y > 585 && (this.flips[0].on || this.flips[1].on);
          if (b.st > (b.r > 12 ? 1.5 : cradle ? 12 : 3.5)) { b.st = 0; b.vx = (this.rng() - 0.5) * 500; b.vy = -350 - this.rng() * 200; this.nudges++; this.emit('nudge', b); }
        }
        if (b.trail) { b.trail.push(b.x, b.y); if (b.trail.length > 16) b.trail.splice(0, 2); }
      }
      if (this.autoT > 0) { this.autoT -= dt; if (this.autoT <= 0) { const lk = this.locked; this.locked = false; this.launch(0.7 + this.rng() * 0.3); this.locked = lk; } }
      // ミッション
      if (!this.cleared) {
        let all = true; for (const m of this.missions) { m.p = Math.min(m.n, m.k === 'score' ? this.score : (this.cnt[m.k] || 0)); const d = m.p >= m.n; if (d && !m.done) { m.done = true; this.emit('mission', m); } if (!d) all = false; }
        if (all && this.missions.length) this.clear();
      }
    }

    colSeg(b, s) {
      let t = s.l2 > 0 ? ((b.x - s.x1) * s.dx + (b.y - s.y1) * s.dy) / s.l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = s.x1 + s.dx * t, cy = s.y1 + s.dy * t; let nx = b.x - cx, ny = b.y - cy; const rr = b.r + s.w, d2 = nx * nx + ny * ny;
      if (d2 >= rr * rr) return 0;
      const d = Math.sqrt(d2); if (d > 1e-6) { nx /= d; ny /= d; } else { nx = s.nx; ny = s.ny; }
      b.x = cx + nx * rr; b.y = cy + ny * rr;
      const vn = b.vx * nx + b.vy * ny; this._nx = nx; this._ny = ny;
      if (vn < 0) { const e = -vn < 50 ? 0 : s.e; b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; return -vn; }
      return 0.001;
    }

    sub(dt) {
      const F = this.flips, G0 = this.ph.g;
      for (const f of F) { const tg = f.on ? f.act : f.rest; let d = tg - f.a; const sp = (f.on ? TUNE.flipUp : TUNE.flipDown) * dt; if (d > sp) d = sp; else if (d < -sp) d = -sp; f.a += d; f.w = d / dt; f.c = Math.cos(f.a); f.s = Math.sin(f.a); }
      let dead = false;
      for (const b of this.balls) {
        if (b.held || b.inShooter) continue;
        let ax = G0 * this.gx, ay = G0 * this.gy, drag = this.ph.damp;
        for (const z of this.zones) {
          if (b.x > z.x && b.x < z.x + z.w && b.y > z.y && b.y < z.y + z.h) {
            if (z.type === 'water') { ay *= 0.45; drag += 1.6; } else if (z.type === 'ice') { ay *= 1.45; }
            else if (z.type === 'conv') ax += z.ax * (z.alt ? (Math.sin(this.t * Math.PI / z.alt) >= 0 ? 1 : -1) : 1);
            if (!this.hinted['zone_' + z.type]) this.hint('zone_' + z.type);
          }
        }
        b.vx += ax * dt; b.vy += ay * dt; if (drag) { const k = 1 - drag * dt; b.vx *= k; b.vy *= k; }
        const s2 = b.vx * b.vx + b.vy * b.vy, MS = TUNE.maxSpeed; if (s2 > MS * MS) { const k = MS / Math.sqrt(s2); b.vx *= k; b.vy *= k; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.ang += b.vx * dt * 0.012;
        if (b.launching && b.x < 345) b.launching = false;
        for (const s of this.segs) {
          if (!s.on || b.x < s.minx || b.x > s.maxx || b.y < s.miny || b.y > s.maxy) continue;
          if (s.kind === 'oneway' && b.launching) continue;
          const imp = this.colSeg(b, s); if (imp <= 0) continue;
          if (s.kind === 'target') { if (imp > 20) this.targetHit(s.ref, b); }
          else if (s.kind === 'sling') { if (imp > 90) { b.vx += this._nx * s.kick; b.vy += this._ny * s.kick; s.hitT = 0.15; this.hint('sling'); this.addScore(10, b.x, b.y, true); this.emit('sling', s); } }
          else if (imp > 260 && imp > this.wallImp) this.wallImp = imp;
        }
        for (const m of this.bumpers) {
          if (!m.on || !m.up) continue; const dx = b.x - m.x, dy = b.y - m.y, rr = b.r + m.r, d2 = dx * dx + dy * dy;
          if (d2 < rr * rr) {
            const d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d; b.x = m.x + nx * rr; b.y = m.y + ny * rr;
            const vn = b.vx * nx + b.vy * ny, k = m.kick * this.ph.kick;
            if (vn < k) { const out = Math.max(-vn * 0.5, k); b.vx += (out - vn) * nx; b.vy += (out - vn) * ny; }
            this.bumperHit(m, b, -vn);
          }
        }
        for (const f of F) {
          const tx = f.c * FL, ty = f.s * FL; let t = ((b.x - f.px) * tx + (b.y - f.py) * ty) / (FL * FL); t = t < 0 ? 0 : t > 1 ? 1 : t;
          const cx = f.px + tx * t, cy = f.py + ty * t, dx = b.x - cx, dy = b.y - cy, rr = b.r + 7 - 2.5 * t, d2 = dx * dx + dy * dy;
          if (d2 < rr * rr) {
            const d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d; b.x = cx + nx * rr; b.y = cy + ny * rr;
            const rx = cx - f.px, ry = cy - f.py, rvx = b.vx + f.w * ry, rvy = b.vy - f.w * rx, vn = rvx * nx + rvy * ny;
            if (vn < 0) { const e = -vn < 60 ? 0 : TUNE.flipE; b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; if (f.w !== 0 && -vn > 350) { b.ex = 'surprised'; b.exT = 0.45; this.emit('flipHit', -vn); } }
          }
        }
        // センサー類
        for (const g of this.gates) if (g.cool <= 0) { const dx = b.x - g.x, dy = b.y - g.y; if (dx * dx + dy * dy < 196) this.gateHit(g, b); }
        for (const s of this.spinners) if (s.cool <= 0) { const dx = b.x - s.x, dy = b.y - s.y; if (dx * dx + dy * dy < 256) { const sp = Math.sqrt(s2); s.cool = 0.3; s.spin = Math.min(40, sp / 25); this.inc('spin'); this.hint('spinner'); this.hit(); this.addScore(50 * Math.max(1, Math.min(8, Math.round(sp / 150))), s.x, s.y); this.emit('spin', s); } }
        for (let i = this.foods.length - 1; i >= 0; i--) { const f = this.foods[i], dx = b.x - f.x, dy = b.y - f.y; if (dx * dx + dy * dy < (b.r + 9) * (b.r + 9)) { this.foods.splice(i, 1); this.inc('food'); this.bow++; this.hint('food'); this.addScore(300, f.x, f.y); this.emit('food', f); } }
        for (const h of this.holes) if (h.cool <= 0) { const dx = b.x - h.x, dy = b.y - h.y; if (dx * dx + dy * dy < 150 && s2 < 810000) { this.holeIn(h, b); break; } }
        if (!b.held) for (const r of this.rails) if (r.cool <= 0 && !r.locked) { const dx = b.x - r.pts[0][0], dy = b.y - r.pts[0][1]; if (dx * dx + dy * dy < r.cap * r.cap) { b.held = { rail: r, d: 0 }; b.vx = b.vy = 0; this.hint('rail'); this.emit('railIn', r); break; } }
        { const v2 = b.vx * b.vx + b.vy * b.vy; if (v2 > MS * MS) { const k = MS / Math.sqrt(v2); b.vx *= k; b.vy *= k; } }
        if (b.y > TH + 30) { b.dead = true; dead = true; }
        else if (!(b.x > -10 && b.x < TW + 10 && b.y > -30 && isFinite(b.vx) && isFinite(b.vy))) { b.x = 371; b.y = 690; b.vx = b.vy = 0; b.inShooter = true; b.launching = false; this.oob++; this.autoT = 0.5; }
      }
      // ボール同士
      const B = this.balls;
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
        const a = B[i], c = B[j]; if (a.held || c.held || a.inShooter || c.inShooter || a.dead || c.dead) continue;
        const dx = c.x - a.x, dy = c.y - a.y, rr = a.r + c.r, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 1e-6) {
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (rr - d) / 2; a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
          const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny; if (rv < 0) { const k = -(1 + 0.9) * rv / 2; a.vx -= k * nx; a.vy -= k * ny; c.vx += k * nx; c.vy += k * ny; if (-rv > 200) this.emit('ballHit', -rv); }
        }
      }
      if (dead) { this.balls = B.filter(b => !b.dead); if (!this.balls.length) this.allDrained(); else this.emit('drain1'); }
    }
  }
  PP.Game = Game; PP.TW = TW; PP.TH = TH; PP.BR = BR; PP.FL = FL;
})();
