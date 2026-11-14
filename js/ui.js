/* PUG PINBALL WORLD - メニュー画面（DOM）。ゲームロジックとは分離 */
(function () {
  'use strict';
  const PP = window.PP, $ = (s, r) => (r || document).querySelector(s), fmt = n => Math.round(n).toLocaleString();
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = () => PP.Save.data;

  function pugCv(fur, expr, acc, size) {
    const cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = size * d; cv.style.width = cv.style.height = size + 'px';
    const c = cv.getContext('2d'); c.translate(size * d / 2, size * d * (acc ? 0.58 : 0.5)); PP.pugFace(c, size * d * (acc ? 0.3 : 0.38), { fur, expr, acc }); return cv;
  }
  function ballCv(skin, size) { const cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = size * d; cv.style.width = cv.style.height = size + 'px'; const c = cv.getContext('2d'); c.translate(size * d / 2, size * d / 2); PP.drawBall(c, size * d * 0.4, skin); return cv; }
  function stagePreview(st, w, hh) {
    const cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = w * d; cv.height = hh * d; cv.style.width = w + 'px'; cv.style.height = hh + 'px';
    const c = cv.getContext('2d'), k = w * d / 372; c.scale(k, k); c.translate(-14, -10);
    const g = c.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, st.theme.a); g.addColorStop(1, st.theme.b); c.fillStyle = g; c.fillRect(0, 0, 400, 720); PP.drawDeco(c, st.theme.deco, st.theme);
    try { const gm = new PP.Game(st, null); gm.frame(0.001); for (const t of gm.targets) PP.drawTarget(c, t, 0); for (const m of gm.bumpers) if (m.on) PP.drawBumper(c, m, 0, 'default'); } catch (e) { }
    return cv;
  }

  const UI = PP.UI = {
    cur: null, mascotRaf: 0,
    init() {
      const ui = $('#ui');
      ui.innerHTML = '<section class="scr" id="s-title"></section><section class="scr" id="s-stages"></section><section class="scr" id="s-collection"></section><section class="scr" id="s-ach"></section><section class="scr" id="s-records"></section><section class="scr" id="s-settings"></section><section class="scr ov" id="s-pause"></section><section class="scr ov" id="s-result"></section><div id="modal"></div>';
      ui.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return; PP.Audio.unlock(); const a = b.dataset.act, v = b.dataset.v;
        if (a !== 'buy' && a !== 'pick') PP.Audio.sfx('ui'); this.act(a, v, b);
      });
    },
    show(name) {
      this.cur = name; document.querySelectorAll('.scr').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
      $('#ui').classList.toggle('on', !!name); $('#ui').classList.toggle('overlay', name === 'pause' || name === 'result');
      cancelAnimationFrame(this.mascotRaf); if (name && this['r_' + name]) this['r_' + name](); if (name) $('#s-' + name).scrollTop = 0;
    },
    toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('on'), ms || 2600); },
    confirm(msg, yes, cb, no) {
      const m = $('#modal'); m.innerHTML = `<div class="mbox"><p>${msg}</p><div class="row"><button class="btn ghost" data-m="0">${no || 'やめる'}</button><button class="btn" data-m="1">${yes}</button></div></div>`; m.classList.add('on');
      m.onclick = e => { const b = e.target.closest('[data-m]'); if (!b && e.target !== m) return; m.classList.remove('on'); m.onclick = null; if (b && b.dataset.m === '1') cb(); };
    },
    head(title) { const s = S(); return `<header class="hd"><button class="back" data-act="go" data-v="title" aria-label="もどる">‹</button><h2>${title}</h2><span class="bow">${fmt(s.bow)}<small>バウ</small></span></header>`; },
    act(a, v, b) {
      const s = S();
      if (a === 'go') this.show(v);
      else if (a === 'start') PP.App.start(+v || s.lastStage || 1);
      else if (a === 'stage') { if (s.unlocked.includes(+v)) PP.App.start(+v); else { PP.Audio.sfx('ng'); this.toast(+v === 11 ? '隠しイベントを2つのステージで見つけると解放' : 'ステージ' + (+v - 1) + 'をクリアすると解放'); } }
      else if (a === 'tab') { this.tab = v; this.r_collection(); }
      else if (a === 'pick') this.pick(b.dataset.cat, v);
      else if (a === 'resume') PP.App.resume(); else if (a === 'retry') PP.App.retry(); else if (a === 'quit') PP.App.quit();
      else if (a === 'again') PP.App.start(PP.App.stageId); else if (a === 'next') PP.App.start(Math.min(10, PP.App.stageId + 1));
      else if (a === 'tutorial') { s.tutorialDone = false; PP.App.start(1); }
      else if (a === 'help') this.confirm('<b>イベントと発生条件</b>' + this.helpHtml(), 'OK', () => { }, 'とじる');
      else if (a === 'reset') this.confirm('セーブデータを全部消します。<br>バウ・パグ・記録がすべて最初に戻ります。<br>本当に消しますか？', '消す', () => { PP.Save.reset(); PP.App.applySettings(); this.show('title'); this.toast('データをリセットしました'); });
      else if (a === 'vib') { s.settings.vib = !s.settings.vib; PP.Save.commit(); if (s.settings.vib && navigator.vibrate) navigator.vibrate(30); this.r_settings(); }
      else if (a === 'quality') { s.settings.quality = v; PP.Save.commit(); PP.App.applySettings(); this.r_settings(); }
    },
    helpHtml() { return '<dl class="help">' + PP.EVENT_HELP.map(e => `<dt>${e[0]}</dt><dd>${e[1]}</dd>`).join('') + '</dl>'; },

    // ===== タイトル =====
    r_title() {
      PP.Save.ensureDaily(); const s = S(), el = $('#s-title'), need = PP.Save.xpNeed(s.level), last = PP.STAGES.find(x => x.id === (s.unlocked.includes(s.lastStage) ? s.lastStage : 1));
      el.innerHTML = `<div class="tbar"><span class="lv">Lv.${s.level}</span><span class="xp"><i style="width:${Math.min(100, s.xp / need * 100)}%"></i><em>あと ${fmt(need - s.xp)} XP</em></span><span class="bow">${fmt(s.bow)}<small>バウ</small></span></div>
      <div class="logo"><span class="l1">PUG</span><span class="l2">PINBALL</span><span class="l3">WORLD</span><p>〜パグの世界でピンボール大冒険〜</p></div>
      <canvas id="mascot" width="520" height="340"></canvas>
      <button class="btn big" data-act="start">ゲームスタート<small>STAGE ${String(last.id).padStart(2, '0')} ${esc(last.name)}</small></button>
      <div class="menu"><button class="btn sub" data-act="go" data-v="stages">ステージ選択</button><button class="btn sub" data-act="go" data-v="collection">コレクション</button><button class="btn sub" data-act="go" data-v="ach">実績</button><button class="btn sub" data-act="go" data-v="records">きろく</button><button class="btn sub" data-act="go" data-v="settings">設定</button></div>
      <div class="card daily"><h3>今日のチャレンジ</h3>${s.daily.tasks.map(t => `<div class="task ${t.done ? 'done' : ''}"><span>${t.done ? '✓' : '・'} ${esc(t.label)}</span><b>${t.done ? '達成 +80' : (t.t === 'score' ? fmt(t.p) : t.p) + '/' + (t.t === 'score' ? fmt(t.n) : t.n)}</b></div>`).join('')}<p class="note">1つ達成で80バウ、全部で+100バウ。毎日0時に入れかわります</p></div>
      ${PP.Save.ok ? '' : '<p class="warn">この環境ではデータを保存できません。閉じると記録が消えます</p>'}`;
      this.mascot();
    },
    mascot() {
      const cv = $('#mascot'); if (!cv) return; const c = cv.getContext('2d'), s = S(), p = PP.PUGS.find(x => x.id === s.pug) || PP.PUGS[0], bl = PP.BALLS.find(x => x.id === s.ball) || PP.BALLS[0], fc = PP.CUSTOM.flipper.items.find(x => x.id === s.look.flipper) || PP.CUSTOM.flipper.items[0];
      let last = 0; const loop = (ts) => {
        if (this.cur !== 'title' || !document.body.contains(cv)) return; this.mascotRaf = requestAnimationFrame(loop); if (ts - last < 33) return; last = ts; const t = ts / 1000;
        c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 260, 170);
        const wag = Math.sin(t * 7) * 0.5; for (const sd of [0, 1]) { const f = { px: sd ? 196 : 64, py: 138, a: sd ? Math.PI + 0.3 + wag : -0.3 - wag }; PP.drawTail(c, f, fc, {}, t); }
        const bx = 130 + Math.sin(t * 1.7) * 92, by = 40 + Math.abs(Math.sin(t * 3.4)) * 70; c.save(); c.translate(bx, 150 - by); c.drawImage(PP.ballSprite(bl), -15, -15, 30, 30); c.restore();
        c.save(); c.translate(130, 96); const an = p.anim; if (an === 'bounce') c.translate(0, -Math.abs(Math.sin(t * 3)) * 10); else if (an === 'tilt') c.rotate(Math.sin(t * 2) * 0.22); else if (an === 'nod') c.translate(0, Math.sin(t * 4) * 4); else if (an === 'wiggle') c.translate(Math.sin(t * 6) * 5, 0); else if (an === 'float') { c.translate(0, Math.sin(t * 1.5) * 8); c.rotate(Math.sin(t * 1.1) * 0.1); }
        PP.pugFace(c, 50, { fur: p.fur, acc: p.acc, expr: (t % 4) > 3.8 ? 'sleepy' : (t % 9) > 7 ? 'happy' : 'normal' }); c.restore();
      }; this.mascotRaf = requestAnimationFrame(loop);
    },

    // ===== ステージ選択 =====
    r_stages() {
      const s = S(), el = $('#s-stages'); el.innerHTML = this.head('ステージ選択') + '<div class="grid g2" id="stg"></div>'; const grid = $('#stg', el);
      for (const st of PP.STAGES) {
        const open = s.unlocked.includes(st.id); if (st.hidden && !open) { grid.appendChild(h(`<button class="scard lock" data-act="stage" data-v="11"><div class="pv q">？</div><b>？？？</b><small>隠しイベントを2ステージで発見すると解放</small></button>`)); continue; }
        const card = h(`<button class="scard ${open ? '' : 'lock'}" data-act="stage" data-v="${st.id}"><div class="pv"></div><em>STAGE ${String(st.id).padStart(2, '0')}${s.cleared[st.id] ? ' <i>★クリア</i>' : ''}</em><b>${esc(st.name)}</b><small>${open ? esc(st.desc) : 'ステージ' + (st.id - 1) + 'クリアで解放'}</small><span class="best">${open ? 'ベスト ' + fmt(s.best[st.id] || 0) : 'LOCK'}</span></button>`);
        $('.pv', card).appendChild(stagePreview(st, 132, 150)); grid.appendChild(card);
      }
      el.appendChild(h('<p class="note c">各ステージの目標を全部達成するとクリア。クリアすると次のステージが開きます</p>'));
    },

    // ===== コレクション =====
    r_collection() {
      const s = S(), el = $('#s-collection'), tab = this.tab || 'pug';
      el.innerHTML = this.head('コレクション') + `<div class="tabs">${[['pug', 'パグ'], ['ball', 'ボール'], ['custom', 'カスタム']].map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-act="tab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div><div id="col"></div>`;
      const col = $('#col', el);
      const card = (cat, it, owned, sel, cv, sub) => { const b = h(`<button class="icard ${owned ? '' : 'no'} ${sel ? 'sel' : ''}" data-act="pick" data-cat="${cat}" data-v="${it.id}"><div class="ic"></div><b>${esc(it.name)}</b><small>${sel ? '使用中' : owned ? 'えらぶ' : it.price < 0 ? '？？？' : fmt(it.price) + ' バウ'}</small>${sub ? `<i>${esc(sub)}</i>` : ''}</button>`); if (cv) $('.ic', b).appendChild(cv); return b; };
      if (tab === 'pug') {
        col.appendChild(h(`<p class="note c">あつめたパグ ${s.pugs.length} / ${PP.PUGS.length}。えらんだパグがタイトルとゲーム画面で応援してくれます</p>`)); const g = h('<div class="grid g3"></div>');
        for (const p of PP.PUGS) { const ow = s.pugs.includes(p.id); const hid = !ow && p.price < 0, cv = pugCv(hid ? 'black' : p.fur, hid ? 'sleepy' : 'normal', hid ? null : p.acc, 64); if (hid) cv.style.filter = 'brightness(.3)'; else if (!ow) cv.style.opacity = '.8'; g.appendChild(card('pug', p, ow, s.pug === p.id, cv, ow ? p.say : p.how)); } col.appendChild(g);
      } else if (tab === 'ball') {
        col.appendChild(h('<p class="note c">ボールの色だけが変わります（性能は同じ）</p>')); const g = h('<div class="grid g3"></div>');
        for (const p of PP.BALLS) g.appendChild(card('ball', p, s.balls.includes(p.id), s.ball === p.id, ballCv(p, 56))); col.appendChild(g);
      } else {
        for (const cat in PP.CUSTOM) {
          const C = PP.CUSTOM[cat]; col.appendChild(h(`<h3 class="sec">${C.name}</h3>`)); const g = h('<div class="grid g4"></div>');
          for (const it of C.items) { const sw = h(`<span class="sw" style="background:${it.c || (cat === 'effect' ? '#ffe066' : cat === 'bg' ? ({ dark: '#262040', dots: '#ffd6e8', stars: '#3b2a7a' }[it.id] || 'linear-gradient(#9ad8ff,#ffe8c4)') : cat === 'bumper' ? ({ neon: '#5af0ff', gold: '#ffcd3c' }[it.id] || '#ff9ec4') : 'linear-gradient(#c9814f,#e0569b)')}">${cat === 'effect' ? { star: '★', heart: '♥', paw: '●', bone: '━' }[it.id] : ''}</span>`); g.appendChild(card(cat, it, s.owned[cat].includes(it.id), s.look[cat] === it.id, sw)); }
          col.appendChild(g);
        }
      }
    },
    pick(cat, id) {
      const s = S(), list = cat === 'pug' ? PP.PUGS : cat === 'ball' ? PP.BALLS : PP.CUSTOM[cat].items, it = list.find(x => x.id === id), own = cat === 'pug' ? s.pugs : cat === 'ball' ? s.balls : s.owned[cat];
      const set = () => { if (cat === 'pug') s.pug = id; else if (cat === 'ball') s.ball = id; else s.look[cat] = id; PP.Save.commit(); this.r_collection(); };
      if (own.includes(id)) { PP.Audio.sfx('ui'); set(); return; }
      if (it.price < 0) { PP.Audio.sfx('ng'); this.toast(it.how || 'ひみつの条件で手に入ります'); return; }
      if (s.bow < it.price) { PP.Audio.sfx('ng'); this.toast('バウが足りません（あと ' + fmt(it.price - s.bow) + ' バウ）'); return; }
      PP.Audio.sfx('ui'); this.confirm(`「${esc(it.name)}」を <b>${fmt(it.price)} バウ</b>で手に入れますか？`, '手に入れる', () => { s.bow -= it.price; own.push(id); PP.Audio.sfx('buy'); const got = PP.Save.checkAch(); set(); this.toast(got.length ? '実績達成：' + got.map(x => x.a.name).join('、') : '手に入れました！'); });
    },

    // ===== 実績 =====
    r_ach() {
      const s = S(), el = $('#s-ach'), n = PP.ACH.filter(a => s.ach[a.id]).length;
      el.innerHTML = this.head('実績') + `<div class="card"><div class="rate"><b>${Math.round(n / PP.ACH.length * 100)}%</b><span class="xp"><i style="width:${n / PP.ACH.length * 100}%"></i></span><small>${n} / ${PP.ACH.length} 達成</small></div></div><div class="list">${PP.ACH.map(a => `<div class="ach ${s.ach[a.id] ? 'done' : ''}"><span class="mk">${s.ach[a.id] ? '★' : '☆'}</span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div><em>${a.pug ? '王様パグ' : ''} +${a.bow}バウ</em></div>`).join('')}</div>`;
    },

    // ===== きろく（ローカルランキング） =====
    r_records() {
      const s = S(), el = $('#s-records'), total = Object.keys(s.best).reduce((a, k) => a + s.best[k], 0);
      el.innerHTML = this.head('きろく') + `<div class="card"><h3>総合スコア（各ステージのベスト合計）</h3><p class="bigNum">${fmt(total)}</p><p class="note">プレイ ${s.plays}回 ／ 最高コンボ ${s.stats.bestCombo} ／ 累計 ${fmt(s.stats.totalScore)}点<br>※この端末だけのローカル記録です。オンラインランキングは未実装です</p></div>
      <h3 class="sec">ステージ別ベスト5</h3><div class="list">${PP.STAGES.filter(st => s.unlocked.includes(st.id)).map(st => `<div class="rec"><b>${String(st.id).padStart(2, '0')} ${esc(st.name)}</b><ol>${(s.top[st.id] || []).map(r => `<li>${fmt(r.s)} <small>${r.d}</small></li>`).join('') || '<li class="none">まだ記録がありません</li>'}</ol></div>`).join('')}</div>
      <h3 class="sec">さいきんのプレイ</h3><div class="list">${s.history.slice(0, 15).map(r => { const st = PP.STAGES.find(x => x.id === r.id); return `<div class="hist"><span>${r.d.slice(5)} ${esc(st ? st.name : '')}${r.cl ? ' ★' : ''}</span><b>${fmt(r.s)}</b><small>${r.c}コンボ</small></div>`; }).join('') || '<p class="note c">まだプレイ記録がありません</p>'}</div>`;
    },

    // ===== 設定 =====
    r_settings() {
      const s = S(), st = s.settings, el = $('#s-settings');
      el.innerHTML = this.head('設定') + `<div class="card set">
      <label>BGM音量<input type="range" min="0" max="100" value="${Math.round(st.bgm * 100)}" data-k="bgm"></label>
      <label>効果音音量<input type="range" min="0" max="100" value="${Math.round(st.sfx * 100)}" data-k="sfx"></label>
      <div class="rowb"><span>振動${navigator.vibrate ? '' : '<small>（この端末・ブラウザは非対応）</small>'}</span><button class="tog ${st.vib ? 'on' : ''}" data-act="vib">${st.vib ? 'ON' : 'OFF'}</button></div>
      <div class="rowb"><span>画質</span><span class="seg"><button class="${st.quality === 'high' ? 'on' : ''}" data-act="quality" data-v="high">きれい</button><button class="${st.quality === 'low' ? 'on' : ''}" data-act="quality" data-v="low">かるい</button></span></div></div>
      <div class="card"><button class="btn sub w" data-act="tutorial">操作説明（チュートリアルをもう一度）</button><button class="btn sub w" data-act="help">イベントと発生条件を見る</button>
      <p class="note">操作：画面の左側タップ＝左のしっぽ、右側タップ＝右のしっぽ。<br>PCは ← → キー（または Z / M）、発射はスペース長押し、P で一時停止</p></div>
      <div class="card"><button class="btn danger w" data-act="reset">データリセット</button><p class="note">保存：${PP.Save.ok ? 'この端末のブラウザ内に自動保存中' : '保存できない環境です'}（データ形式 v${s.v}）</p></div>`;
      el.querySelectorAll('input[type=range]').forEach(inp => inp.oninput = () => { st[inp.dataset.k] = inp.value / 100; PP.App.applySettings(); if (inp.dataset.k === 'sfx') PP.Audio.sfx('bumper'); }, false);
      el.querySelectorAll('input[type=range]').forEach(inp => inp.onchange = () => PP.Save.commit());
    },

    // ===== 一時停止 =====
    r_pause() {
      const g = PP.App.g, el = $('#s-pause'); if (!g) return;
      el.innerHTML = `<div class="mbox wide"><h2>ポーズ</h2><p class="note c">STAGE ${String(g.st.id).padStart(2, '0')} ${esc(g.st.name)}</p><div class="miss">${g.missions.map(m => `<div class="${m.done ? 'done' : ''}"><span>${m.done ? '✓' : '○'} ${esc(m.t)}</span><b>${m.k === 'score' ? fmt(m.p) + ' / ' + fmt(m.n) : m.p + ' / ' + m.n}</b></div>`).join('')}</div>
      <button class="btn big" data-act="resume">つづける</button><div class="row"><button class="btn sub" data-act="retry">やりなおす</button><button class="btn sub" data-act="quit">やめる</button></div><details><summary>イベントと発生条件</summary>${this.helpHtml()}</details></div>`;
    },

    // ===== リザルト =====
    showResult(r) {
      this.result = r; this.show('result'); const el = $('#s-result'), id = PP.App.stageId, canNext = r.cleared && id < 10 && S().unlocked.includes(id + 1);
      el.innerHTML = `<div class="mbox wide res"><h2>${r.cleared ? 'ステージクリア！' : 'ゲームオーバー'}</h2><div class="rpug"></div>
      <p class="bigNum">${fmt(r.score)}<small>点</small></p>${r.best ? '<p class="newbest">★ 自己ベスト更新！ ★</p>' : `<p class="note c">自己ベスト ${fmt(r.prevBest)}</p>`}
      <div class="stats"><div><small>最高コンボ</small><b>${r.combo}</b></div><div><small>獲得XP</small><b>+${fmt(r.xp)}</b></div><div><small>獲得バウ</small><b>+${fmt(r.bow)}</b></div></div>
      <div class="lvl"><span class="lv">Lv.${r.level}</span><span class="xp"><i style="width:${Math.min(100, r.xpNow / r.xpNeed * 100)}%"></i></span></div>
      ${r.levelUps.map(l => `<p class="got">レベルアップ！ Lv.${l.level}　+${l.bow}バウ</p>`).join('')}
      ${r.firstClear ? `<p class="got">初クリアボーナス${canNext ? '　つぎのステージが開いた！' : ''}</p>` : ''}
      ${r.ach.map(x => `<p class="got">実績「${esc(x.a.name)}」+${x.a.bow}バウ</p>`).join('')}
      ${r.items.concat(PP.App.gotItems || []).map(x => `<p class="got item">新しく手に入れた：${esc(x)}</p>`).join('')}
      ${r.daily.map(x => `<p class="got">チャレンジ達成：${esc(x.label)} +${x.bow}バウ</p>`).join('')}
      ${r.saved ? '' : '<p class="warn">保存に失敗しました。ブラウザの空き容量やプライベートモードを確認してください</p>'}
      <button class="btn big" data-act="again">もう一度遊ぶ</button><div class="row">${canNext ? '<button class="btn sub" data-act="next">つぎのステージ</button>' : ''}<button class="btn sub" data-act="go" data-v="stages">ステージ選択</button><button class="btn sub" data-act="go" data-v="title">タイトル</button></div></div>`;
      const p = PP.PUGS.find(x => x.id === S().pug) || PP.PUGS[0]; $('.rpug', el).appendChild(pugCv(p.fur, r.cleared || r.best ? 'happy' : 'sad', p.acc, 84));
    }
  };
})();
