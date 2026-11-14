/* PUG PINBALL WORLD - セーブデータ（LocalStorage・バージョン管理つき） */
(function () {
  'use strict';
  const PP = window.PP, KEY = 'pugPinballWorld.save', VERSION = 1;
  const fresh = () => ({
    v: VERSION, level: 1, xp: 0, bow: 0, unlocked: [1], cleared: {}, best: {}, top: {}, history: [],
    pugs: ['fawn'], pug: 'fawn', balls: ['normal'], ball: 'normal',
    owned: { flipper: ['fawn'], effect: ['star'], bumper: ['default'], frame: ['theme'], bg: ['theme', 'dark'] },
    look: { flipper: 'fawn', effect: 'star', bumper: 'default', frame: 'theme', bg: 'theme' },
    ach: {}, settings: { bgm: 0.5, sfx: 0.8, vib: true, quality: 'high' }, plays: 0, tutorialDone: false, hints: {}, secrets: {},
    daily: null, lastStage: 1, stats: { bestScore: 0, bestCombo: 0, bumpers: 0, totalScore: 0, fever: 0, multiball: 0, jackpot: 0, superjp: 0, boss: 0 }
  });
  // 旧バージョンのデータを新しい形に合わせる（項目追加に強くする）
  function migrate(d) {
    const f = fresh(); if (!d || typeof d !== 'object') return f;
    for (const k in f) if (d[k] === undefined || d[k] === null && k !== 'daily') d[k] = f[k];
    for (const k of ['owned', 'look', 'settings', 'stats']) for (const j in f[k]) if (d[k][j] === undefined) d[k][j] = f[k][j];
    d.v = VERSION; return d;
  }
  const Save = PP.Save = {
    data: fresh(), ok: true, err: null,
    load() {
      try { const raw = localStorage.getItem(KEY); if (raw) this.data = migrate(JSON.parse(raw)); }
      catch (e) { this.ok = false; this.err = e; this.data = fresh(); }
      this.ensureDaily(); return this.data;
    },
    commit() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); this.ok = true; return true; }
      catch (e) { const first = this.ok; this.ok = false; this.err = e; if (first && this.onError) this.onError(e); return false; }
    },
    reset() { this.data = fresh(); try { localStorage.removeItem(KEY); } catch (e) { } this.ensureDaily(); this.commit(); },
    today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    xpNeed(l) { return Math.round(120 * Math.pow(l, 1.4)); },
    // 日付から決まる3つの課題（毎日更新）
    ensureDaily() {
      const S = this.data, day = this.today(); if (S.daily && S.daily.date === day) return;
      let h = 0; for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
      const un = S.unlocked.filter(i => i <= 10), st = un[Math.floor(rnd() * un.length)], sc = [20000, 50000, 100000][Math.floor(rnd() * 3)];
      const pool = [{ t: 'score', n: sc, label: '1ゲームで' + sc.toLocaleString() + '点とる' }, { t: 'bumper', n: 80, label: 'バンパーに80回当てる' }, { t: 'paw', n: 20, label: '肉球バンパーに20回当てる（ステージ1など）' },
      { t: 'combo5', n: 5, label: '5コンボを5回決める' }, { t: 'clear', n: 1, stage: st, label: 'ステージ' + st + 'をクリアする' }, { t: 'play', n: 3, label: '3回プレイする' }, { t: 'best', n: 1, label: '今日のハイスコアを更新する' }];
      const tasks = []; while (tasks.length < 3) { const i = Math.floor(rnd() * pool.length); tasks.push(Object.assign({ p: 0, done: false }, pool.splice(i, 1)[0])); }
      S.daily = { date: day, tasks, plays: 0, best: 0, bonus: false };
    },
    markClear(id) { const S = this.data, first = !S.cleared[id]; S.cleared[id] = (S.cleared[id] || 0) + 1; if (id < 10 && !S.unlocked.includes(id + 1)) S.unlocked.push(id + 1); this.commit(); return first; },
    markSecret(id) {
      const S = this.data, out = []; S.secrets[id] = 1;
      if (!S.pugs.includes('phantom')) { S.pugs.push('phantom'); out.push('まぼろしパグ'); }
      if (Object.keys(S.secrets).length >= 2 && !S.unlocked.includes(11)) { S.unlocked.push(11); out.push('隠しステージ「ひみつのパグ天国」'); }
      this.commit(); return out;
    },
    checkAch() {
      const S = this.data, out = [];
      for (let pass = 0; pass < 2; pass++) for (const a of PP.ACH) if (!S.ach[a.id] && a.ok(S)) { S.ach[a.id] = this.today(); S.bow += a.bow; let item = null; if (a.pug && !S.pugs.includes(a.pug)) { S.pugs.push(a.pug); item = PP.PUGS.find(p => p.id === a.pug).name; } out.push({ a, item }); }
      return out;
    },
    // 1ゲーム終了時の集計
    applyResult(g, firstClear) {
      this.ensureDaily(); const S = this.data, id = g.st.id, c = g.cnt, r = { score: g.score, combo: g.maxCombo, items: [], levelUps: [], daily: [] };
      S.plays++; S.daily.plays++; S.lastStage = id;
      r.best = g.score > (S.best[id] || 0); r.prevBest = S.best[id] || 0; if (r.best) S.best[id] = g.score;
      const top = S.top[id] = (S.top[id] || []); top.push({ s: g.score, d: this.today() }); top.sort((a, b) => b.s - a.s); top.length = Math.min(top.length, 5);
      S.history.unshift({ id, s: g.score, c: g.maxCombo, d: this.today(), cl: g.cleared ? 1 : 0 }); S.history.length = Math.min(S.history.length, 30);
      const st = S.stats; st.bestScore = Math.max(st.bestScore, g.score); st.bestCombo = Math.max(st.bestCombo, g.maxCombo); st.bumpers += c.bumper || 0; st.totalScore += g.score;
      for (const k of ['fever', 'multiball', 'jackpot', 'superjp', 'boss']) st[k] += c[k] || 0;
      r.cleared = g.cleared; r.firstClear = firstClear;
      r.bow = Math.round((Math.floor(g.score / 500) + g.bow + (g.cleared ? (firstClear ? 100 + 50 * Math.min(id, 10) : 30) : 0)) * (g.st.bowMul || 1));
      r.xp = Math.floor(g.score / 200) + 20 + (g.cleared ? 100 : 0);
      S.bow += r.bow; S.xp += r.xp;
      while (S.xp >= this.xpNeed(S.level)) { S.xp -= this.xpNeed(S.level); S.level++; const rw = 50 + 25 * S.level; S.bow += rw; r.levelUps.push({ level: S.level, bow: rw }); }
      const todayBest = g.score > S.daily.best && S.daily.best > 0 || (S.daily.best === 0 && r.best && r.prevBest > 0); S.daily.best = Math.max(S.daily.best, g.score);
      for (const t of S.daily.tasks) {
        if (t.done) continue;
        if (t.t === 'score') t.p = Math.max(t.p, Math.min(t.n, g.score)); else if (t.t === 'play') t.p++; else if (t.t === 'clear') { if (g.cleared && id === t.stage) t.p = 1; } else if (t.t === 'best') { if (todayBest || r.best) t.p = 1; } else t.p = Math.min(t.n, t.p + (c[t.t] || 0));
        if (t.p >= t.n) { t.done = true; S.bow += 80; r.daily.push({ label: t.label, bow: 80 }); }
      }
      if (!S.daily.bonus && S.daily.tasks.every(t => t.done)) { S.daily.bonus = true; S.bow += 100; r.daily.push({ label: '今日の課題を全部達成！', bow: 100 }); }
      r.ach = this.checkAch(); for (const x of r.ach) if (x.item) r.items.push(x.item);
      r.level = S.level; r.xpNow = S.xp; r.xpNeed = this.xpNeed(S.level); r.saved = this.commit(); return r;
    }
  };
})();
