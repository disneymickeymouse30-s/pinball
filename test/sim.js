// 自動プレイによる物理・ルール検証（node test/sim.js [games]）
const path = require('path');
require(path.join(__dirname, '../js/data.js'));
require(path.join(__dirname, '../js/game.js'));
const PP = globalThis.PP;
function rngOf(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function play(stage, seed, skill) {
  const rng = rngOf(seed); const ev = {};
  const g = new PP.Game(stage, (n, d) => { ev[n] = (ev[n] || 0) + 1; if (n === 'nudge') { const k = Math.round(d.x / 20) * 20 + ',' + Math.round(d.y / 20) * 20 + (d.r > 12 ? 'G' : ''); NUD[k] = (NUD[k] || 0) + 1; } }, { rng });
  let t = 0, hold = [0, 0], cd = [0, 0], maxV = 0, bad = 0, minY = 1e9;
  const dt = 1 / 60;
  while (!g.over && t < 900) {
    if (g.phase === 'ready' && g.balls.some(b => b.inShooter) && g.autoT <= 0) g.launch(rng());
    for (let i = 0; i < 2; i++) {
      let want = false;
      for (const b of g.balls) {
        if (b.held || b.inShooter) continue;
        const inX = i === 0 ? (b.x > 95 && b.x < 185) : (b.x > 185 && b.x < 275);
        if (inX && b.y > 600 + (1 - skill) * 30 * rng() && b.y < 672 && b.vy > -150) want = true;
      }
      cd[i] -= dt; if (want && cd[i] <= 0 && rng() < skill) { hold[i] = 0.16; cd[i] = 0.45; }
      hold[i] -= dt; g.setFlip(i, hold[i] > 0);
    }
    g.update(dt); t += dt;
    for (const b of g.balls) {
      const v = Math.hypot(b.vx, b.vy); if (v > maxV) maxV = v; if (b.y < minY) minY = b.y;
      if (!b.inShooter && !b.held) {
        if (b.x < 14 + b.r - 3 || b.x > 386 - b.r + 3 || (b.y < 200 && Math.hypot(b.x - 200, b.y - 200) > 186 - b.r + 4)) bad++;
        if (!b.launching && b.x > 356 + 2 && b.x < 386 && b.y < 650 && b.y > 170) bad++; // 発射レーンに逆流
      }
    }
  }
  return { score: g.score, t, cleared: g.cleared, nudges: g.nudges, oob: g.oob, maxV, bad, maxCombo: g.maxCombo, cnt: g.cnt, ev, timeout: !g.over, miss: g.missions.map(m => m.done ? 1 : 0).join('') };
}
const NUD = {};
const N = +process.argv[2] || 20, skill = +process.argv[3] || 0.85;
let fail = 0;
for (const st of PP.STAGES) {
  let sum = 0, tt = 0, cl = 0, nud = 0, oob = 0, bad = 0, mv = 0, mc = 0, fev = 0, to = 0, mb = 0, jp = 0, sec = 0; const sc = []; const miss = {};
  for (let i = 0; i < N; i++) {
    const r = play(st, 1000 + i * 7919 + st.id, skill);
    sum += r.score; tt += r.t; cl += r.cleared ? 1 : 0; nud += r.nudges; oob += r.oob; bad += r.bad; mv = Math.max(mv, r.maxV); mc = Math.max(mc, r.maxCombo);
    fev += r.cnt.fever || 0; to += r.timeout ? 1 : 0; mb += r.cnt.multiball || 0; jp += r.cnt.jackpot || 0; sec += r.cnt.secret || 0; sc.push(r.score); miss[r.miss] = (miss[r.miss] || 0) + 1;
  }
  sc.sort((a, b) => a - b);
  console.log(`S${String(st.id).padStart(2)} ${st.name.padEnd(10, '　')} med=${String(sc[N >> 1]).padStart(7)} avg=${String(Math.round(sum / N)).padStart(7)} time=${(tt / N).toFixed(0).padStart(3)}s clear=${cl}/${N} fever=${(fev / N).toFixed(1)} multi=${(mb / N).toFixed(1)} jp=${(jp / N).toFixed(1)} secret=${sec} maxCombo=${mc} nudge=${nud} oob=${oob} bad=${bad} timeout=${to} maxV=${mv.toFixed(0)} miss=${JSON.stringify(miss)}`);
  if (oob || bad) fail++;
}
console.log('nudge地点', Object.entries(NUD).sort((a, b) => b[1] - a[1]).slice(0, 10).join(' | '));
console.log(fail ? 'NG: 物理の異常あり' : 'OK: 画面外・壁抜けなし');
process.exit(fail ? 1 : 0);
