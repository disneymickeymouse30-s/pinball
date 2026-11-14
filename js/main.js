/* PUG PINBALL WORLD - 起動・入力・ゲームループ・演出のつなぎ込み */
(function () {
  'use strict';
  const PP = window.PP, Save = PP.Save, Au = PP.Audio, UI = PP.UI;
  const cv = document.getElementById('game'), rend = new PP.Renderer(cv);
  const ptr = new Map(), keys = { L: false, R: false };
  let raf = 0, last = 0, chargeAt = 0, overTimer = 0, tutTimer = 0;
  const vib = (p) => { if (Save.data.settings.vib && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { } } };
  const BCOL = { paw: '#ff9ec4', face: '#ffe066', shisa: '#ff8a4c', planet: '#c9a2ff', fish: '#ffb347', candy: '#ff5c8a', snow: '#ffffff', manju: '#d9a066', eel: '#fff', boss: '#ffd24a', gold: '#ffd84a' };

  const App = PP.App = {
    g: null, stageId: 1, paused: false, running: false, firstClear: false, gotItems: [],
    look() {
      const s = Save.data, f = (l, id) => l.find(x => x.id === id) || l[0], fr = f(PP.CUSTOM.frame.items, s.look.frame);
      return { pug: f(PP.PUGS, s.pug), ball: f(PP.BALLS, s.ball), flip: f(PP.CUSTOM.flipper.items, s.look.flipper), effect: s.look.effect, bumper: s.look.bumper, frameC: fr.c || null, bg: s.look.bg };
    },
    applySettings() { const st = Save.data.settings; Au.setVol(st.bgm, st.sfx); if (rend.quality !== st.quality) { rend.quality = st.quality; rend.resize(); } },
    start(id) {
      const st = PP.STAGES.find(s => s.id === id) || PP.STAGES[0]; clearTimeout(overTimer); clearTimeout(tutTimer);
      this.stageId = st.id; this.firstClear = false; this.gotItems = []; this.paused = false; ptr.clear(); keys.L = keys.R = false; chargeAt = 0;
      const g = this.g = new PP.Game(st, onEvent); rend.setGame(g, this.look()); Save.data.lastStage = st.id;
      if (!Save.data.tutorialDone && st.id === 1) { g.locked = true; rend.tut = { step: 0 }; }
      UI.show(null); Au.unlock(); Au.fever(false); Au.bgm(st.bgm); rend.banner('STAGE ' + String(st.id).padStart(2, '0') + '　' + st.name, g.missions[0] ? '目標：' + g.missions.map(m => m.t).join(' ／ ') : '');
      this.run();
    },
    run() { if (this.running) return; this.running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { this.running = false; cancelAnimationFrame(raf); },
    pause() { if (!this.g || this.g.over || this.paused || UI.cur) return; this.paused = true; this.g.setFlip(0, false); this.g.setFlip(1, false); ptr.clear(); chargeAt = 0; rend.charge = -1; this.stop(); Au.suspend(); UI.show('pause'); },
    resume() { if (!this.paused) return; this.paused = false; UI.show(null); Au.resume(); this.run(); },
    finish(show) { const g = this.g; if (!g || g.done) return null; g.done = true; clearTimeout(overTimer); this.stop(); Au.bgm(null); Au.resume(); const r = Save.applyResult(g, this.firstClear); if (r.levelUps.length) Au.sfx('levelup'); if (show) UI.showResult(r); return r; },
    retry() { this.paused = false; this.finish(false); this.start(this.stageId); },
    quit() { this.paused = false; this.finish(true); }
  };

  // ----- ゲームからの通知 → 音・演出・振動・保存 -----
  function onEvent(n, d) {
    const g = App.g; if (!g) return;
    switch (n) {
      case 'score': if (d.pts >= 50) rend.pop(d.x, d.y, '+' + d.pts.toLocaleString(), d.big); if (d.big) { rend.mood = 'happy'; rend.moodT = 1; } break;
      case 'bumper': Au.sfx(d.k === 'boss' ? 'boss' : 'bumper', d.v); if (d.k === 'face' || d.k === 'shisa') Au.sfx('bark'); rend.burst(d.x, d.y, 5, BCOL[d.k] || '#ffe066'); vib(8); break;
      case 'target': Au.sfx('target'); rend.burst(d.x, d.y, 7, '#fff'); vib(12); break;
      case 'bank': Au.sfx('bark2'); vib([20, 30, 20]); break;
      case 'gate': Au.sfx('gate'); rend.burst(d.x, d.y, 4, '#ffe14a'); break;
      case 'hole': Au.sfx('hole'); vib(20); break;
      case 'eject': Au.sfx('eject'); rend.burst(d.x, d.y, 6, '#fff'); break;
      case 'railIn': Au.sfx('rail'); break;
      case 'railEnd': rend.burst(d.pts[d.pts.length - 1][0], d.pts[d.pts.length - 1][1], 10, '#ffe14a'); vib(15); break;
      case 'flip': Au.sfx('flip'); rend.flip(d); { const f = g.flips[d]; rend.burst(f.px + (d ? -50 : 50), f.py - 6, 2, d ? '#9fd0ff' : '#ff9ec4', 60); } tutorial('flip', d); break;
      case 'flipHit': vib(6); break;
      case 'launch': Au.sfx('launch'); vib(15); tutorial('launch'); break;
      case 'sling': Au.sfx('sling'); vib(8); break;
      case 'wall': Au.sfx('wall', d); break;
      case 'ballHit': Au.sfx('wall', d * 2); break;
      case 'combo': Au.sfx('combo', d); if (d === 5 || d === 10 || d % 25 === 0) vib(25); break;
      case 'food': Au.sfx('food'); rend.burst(d.x, d.y, 4, '#d9a066'); break;
      case 'spin': Au.sfx('spin'); break;
      case 'burst': rend.burst(d.x, d.y, 16, '#fff', 200); break;
      case 'bossHit': rend.shake = 0.12; break;
      case 'bossDown': rend.fly(20); rend.shake = 0.6; rend.burst(d.x, d.y, 30, '#ffd24a', 260); break;
      case 'jackpot': Au.sfx('jackpot'); rend.shake = 0.35; rend.fly(d ? 12 : 6); vib([40, 40, 80]); break;
      case 'feverEnd': Au.fever(false); break;
      case 'ballLost': Au.sfx('drain'); Au.fever(false); rend.mood = 'sad'; rend.moodT = 1.6; vib(70); break;
      case 'saved': Au.sfx('saved'); hint('save'); break;
      case 'nudge': rend.banner('パグがテーブルをゆすった！', '', 'hint'); rend.shake = 0.2; break;
      case 'mission': Au.sfx('gate'); rend.banner('目標達成！', d.t); break;
      case 'hint': hint(d); break;
      case 'secret': { const got = Save.markSecret(g.st.id); App.gotItems = App.gotItems.concat(got); if (got.length) rend.banner('解放！', got.join('、')); rend.fly(10, 'ghost'); break; }
      case 'clear': App.firstClear = Save.markClear(g.st.id) || App.firstClear; Au.sfx('clear'); rend.fly(14); for (let i = 0; i < 6; i++) rend.burst(40 + i * 58, 200 + (i % 2) * 60, 8, ['#ff5c8a', '#ffe14a', '#7be08a', '#62a8ff'][i % 4], 200); vib([40, 40, 40, 40, 120]); break;
      case 'over': Au.sfx('over'); Au.bgm(null); overTimer = setTimeout(() => App.finish(true), 1500); break;
      case 'event':
        rend.banner(d.title, d.desc);
        if (d.id === 'fever') { Au.sfx('fever'); Au.fever(true); rend.fly(18); vib([30, 40, 30, 40, 60]); }
        else if (d.id === 'gather') { Au.sfx('bark2'); rend.fly(9); } else if (d.id === 'extra') Au.sfx('extra'); else if (d.id === 'multiball') Au.sfx('bark2');
        else if (d.id === 'giant' || d.id === 'food' || d.id === 'rush' || d.id === 'door') Au.sfx('gate'); else if (d.id === 'grav') Au.sfx('spin'); else if (d.id === 'seqfail') Au.sfx('ng');
        break;
    }
  }
  function hint(k) { const s = Save.data; if (s.hints[k] || !PP.HINTS[k] || rend.tut) return; s.hints[k] = 1; rend.banner(PP.HINTS[k], '', 'hint'); }
  // チュートリアル：実際に操作すると次へ進む
  function tutorial(kind, d) {
    const t = rend.tut, g = App.g; if (!t) return;
    if (kind === 'flip') {
      if (t.step === 0 && d === 0) t.step = 1; else if (t.step === 1 && d === 1) t.step = 2;
      else if (t.step === 2 && g.flips[0].on && g.flips[1].on) { t.step = 3; g.locked = false; Au.sfx('gate'); }
    } else if (kind === 'launch' && t.step === 3) { t.step = 4; Save.data.tutorialDone = true; Save.commit(); Au.sfx('bark2'); tutTimer = setTimeout(() => { if (rend.tut === t) rend.tut = null; }, 2600); }
  }

  function frame(ts) {
    if (!App.running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts; const g = App.g;
    if (chargeAt) rend.charge = Math.min(1, (ts - chargeAt) / 800);
    g.update(dt); rend.draw(dt);
  }

  // ----- 入力（左右タップ・同時押し・連打に対応） -----
  function sync() { const g = App.g; if (!g || App.paused) return; let L = keys.L, R = keys.R; for (const v of ptr.values()) { if (v === 'L') L = true; else if (v === 'R') R = true; } g.setFlip(0, L); g.setFlip(1, R); }
  function canLaunch() { const g = App.g; return g && !g.over && !g.locked && g.phase === 'ready' && g.balls.some(b => b.inShooter); }
  function fire() { if (!chargeAt) return; const p = Math.min(1, (performance.now() - chargeAt) / 800); chargeAt = 0; rend.charge = -1; if (App.g) App.g.launch(p); }
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); Au.unlock(); const g = App.g; if (!g || App.paused || UI.cur) return;
    const p = rend.toTable(e.clientX, e.clientY);
    if (p.y < 4 && p.x > 335) { App.pause(); return; }
    if (g.over) return;
    if (canLaunch() && p.x > 322 && p.y > 420) { ptr.set(e.pointerId, 'launch'); if (!chargeAt) chargeAt = performance.now(); return; }
    ptr.set(e.pointerId, e.clientX < window.innerWidth / 2 ? 'L' : 'R'); sync();
  }, { passive: false });
  const up = e => { const k = ptr.get(e.pointerId); if (k === undefined) return; ptr.delete(e.pointerId); if (k === 'launch') { if (![...ptr.values()].includes('launch')) fire(); } else sync(); };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  for (const ev of ['touchstart', 'touchmove', 'touchend']) cv.addEventListener(ev, e => e.preventDefault(), { passive: false });
  for (const ev of ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  const KL = ['ArrowLeft', 'z', 'Z', 'a', 'A'], KR = ['ArrowRight', 'm', 'M', 'l', 'L', '/'], KF = [' ', 'ArrowUp', 'Enter'];
  window.addEventListener('keydown', e => {
    if (UI.cur && UI.cur !== 'pause') return; if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { App.paused ? App.resume() : App.pause(); return; } if (!App.g || App.paused) return;
    if (KL.includes(e.key)) { keys.L = true; sync(); e.preventDefault(); } else if (KR.includes(e.key)) { keys.R = true; sync(); e.preventDefault(); }
    else if (KF.includes(e.key)) { e.preventDefault(); Au.unlock(); if (canLaunch() && !chargeAt) chargeAt = performance.now(); }
  });
  window.addEventListener('keyup', e => { if (KL.includes(e.key)) { keys.L = false; sync(); } else if (KR.includes(e.key)) { keys.R = false; sync(); } else if (KF.includes(e.key)) fire(); });

  // ----- 画面サイズ・バックグラウンド -----
  function resize() { const pr = document.getElementById('safe'), cs = getComputedStyle(pr); rend.safe = { t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 }; rend.resize(); if (App.g && !App.running) rend.draw(0); }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200)); if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (App.running && App.g && !App.g.over) App.pause(); else Au.suspend(); } else if (!App.paused) Au.resume(); });
  window.addEventListener('pagehide', () => { if (App.g && !App.g.over && !App.g.done && App.g.score > 0) Save.commit(); });

  // ----- 起動 -----
  Save.onError = () => UI.toast('データを保存できませんでした（空き容量・プライベートモードを確認）', 4000);
  Save.load(); UI.init(); rend.quality = Save.data.settings.quality; App.applySettings(); resize(); UI.show('title');
  if (!Save.ok) UI.toast('この環境では保存が使えません。記録は閉じると消えます', 4000);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.PP_NO_SW) { try { navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { } }
  window.PP_TEST = { App, rend, sync };
})();
