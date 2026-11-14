/* PUG PINBALL WORLD - データ定義（ステージ・コレクション・実績） */
var PP = (typeof window !== 'undefined' ? window : globalThis).PP = ((typeof window !== 'undefined' ? window : globalThis).PP || {});
(function () {
  'use strict';
  // Catmull-Rom でなめらかなレール経路を作る
  function curve(p, n) {
    const out = [];
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      const m = Math.max(2, Math.round(n / (p.length - 1)));
      for (let j = 0; j < m; j++) {
        const t = j / m, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    out.push(p[p.length - 1].slice());
    return out;
  }
  // 壁沿いの縦ターゲット列
  const V = (x, y0, n, kind, grp, gap) => { const a = []; for (let i = 0; i < n; i++) { const y = y0 + i * (gap || 36); a.push([x, y, x, y + 26, kind, grp]); } return a; };
  const PEG = (x, y, kind, grp, seq) => [x, y, x, y, kind, grp, seq];
  const RING = (cx, cy, R, n, r, kind) => { const a = []; for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + i * 2 * Math.PI / n; a.push([Math.round(cx + R * Math.cos(an)), Math.round(cy + R * Math.sin(an)), r, kind]); } return a; };

  PP.STAGES = [
    {
      id: 1, name: 'パグの街', desc: '肉球バンパーと骨ターゲットの基本ステージ', saveTime: 20,
      theme: { a: '#9ad8ff', b: '#ffe8c4', wall: '#c9814f', deco: 'town' },
      bgm: { bpm: 112, root: 60, scale: [0, 2, 4, 7, 9], wave: 'triangle' },
      bumpers: [[120, 215, 22, 'paw'], [250, 215, 22, 'paw'], [185, 288, 24, 'face', { secret: 1 }], [185, 183, 17, 'butt']],
      targets: [...V(18, 330, 3, 'bone', 'A'), ...V(352, 330, 3, 'bone', 'B')],
      holes: [[312, 250, 'house', null, -180, 160]], spinners: [[58, 250]],
      missions: [{ k: 'bank', n: 1, t: '骨ターゲットを1列ぜんぶ倒す' }, { k: 'score', n: 15000, t: '15,000点とる' }]
    },
    {
      id: 2, name: 'パグの遊園地', desc: '回るティーカップとコースターレール',
      theme: { a: '#ffb3d1', b: '#fff3b0', wall: '#e0569b', deco: 'park' },
      bgm: { bpm: 132, root: 62, scale: [0, 2, 4, 5, 7, 9, 11], wave: 'square' },
      bumpers: [[185, 258, 20, 'face', { secret: 1 }], [0, 0, 15, 'cushion', { orbit: [185, 258, 68, 0.9, 0] }], [0, 0, 15, 'cushion', { orbit: [185, 258, 68, 0.9, 2.094] }], [0, 0, 15, 'cushion', { orbit: [185, 258, 68, 0.9, 4.189] }]],
      rails: [{ pts: curve([[36, 440], [30, 340], [52, 220], [120, 150], [220, 140], [300, 180], [322, 250]], 48), kind: 'coaster', score: 1000, speed: 560, exit: 300 }],
      gates: [[322, 350, 'bonus']],
      targets: V(352, 400, 2, 'bone', 'A').concat(V(18, 250, 2, 'bone', 'A')),
      holes: [[296, 448, 'tent', null, -200, -320]],
      missions: [{ k: 'rail', n: 2, t: 'コースターに2回乗る' }, { k: 'bank', n: 1, t: '骨ターゲットを全部倒す' }, { k: 'score', n: 30000, t: '30,000点とる' }]
    },
    {
      id: 3, name: 'パグの温泉', desc: 'お湯の中はふわふわ。温泉まんじゅうを集めよう',
      theme: { a: '#ffd9b8', b: '#d8f3ee', wall: '#8a5a44', deco: 'onsen' },
      bgm: { bpm: 92, root: 57, scale: [0, 2, 3, 7, 8], wave: 'sine' },
      zones: [{ x: 95, y: 235, w: 180, h: 100, type: 'water' }],
      bumpers: [[110, 185, 20, 'manju'], [260, 185, 20, 'manju'], [185, 285, 18, 'bowl', { secret: 1, kick: 330 }]],
      targets: [...V(18, 300, 3, 'manju', 'A'), ...V(352, 300, 3, 'manju', 'B')],
      holes: [[60, 232, 'onsen', null, 160, -80]], spinners: [[312, 232]],
      missions: [{ k: 'bank', n: 2, t: 'まんじゅうターゲットを2列倒す' }, { k: 'hole', n: 2, t: '足湯の穴に2回入る' }, { k: 'score', n: 40000, t: '40,000点とる' }]
    },
    {
      id: 4, name: '沖縄パグアイランド', desc: '波に流されながらシーサーとゴーヤをねらえ',
      theme: { a: '#39c6e8', b: '#fff1c9', wall: '#e2603a', deco: 'okinawa' },
      bgm: { bpm: 104, root: 60, scale: [0, 4, 5, 7, 11], wave: 'sanshin' },
      zones: [{ x: 14, y: 135, w: 342, h: 50, type: 'conv', ax: 260, alt: 4 }],
      bumpers: [[115, 245, 24, 'shisa'], [255, 245, 24, 'shisa'], [185, 315, 20, 'food', { secret: 1 }]],
      targets: [...V(18, 300, 2, 'goya', 'A'), ...V(352, 300, 2, 'goya', 'A')],
      holes: [[312, 425, 'cave', null, -200, -320]], spinners: [[58, 225]], gates: [[185, 205, 'bonus']],
      missions: [{ k: 'bank', n: 2, t: 'ゴーヤを全部倒す ×2' }, { k: 'bumper', n: 40, t: 'バンパーに40回当てる' }, { k: 'score', n: 50000, t: '50,000点とる' }]
    },
    {
      id: 5, name: 'パグの海底王国', desc: 'チンアナゴとニシキアナゴが顔を出す、ゆらゆら海の底',
      saveTime: 15, theme: { a: '#1565c0', b: '#4dd0e1', wall: '#00838f', deco: 'sea' }, phys: { g: 780, damp: 0.3 },
      bgm: { bpm: 96, root: 55, scale: [0, 2, 5, 7, 9], wave: 'sine' },
      bumpers: [[0, 0, 18, 'fish', { slide: [70, 205, 300, 205, 7, 0] }], [0, 0, 18, 'fish', { slide: [300, 290, 70, 290, 8, 0.3] }],
      [120, 405, 10, 'eel', { eel: [4.5, 0, 0.55], skin: 0 }], [165, 420, 10, 'eel', { eel: [4.5, 0.25, 0.55], skin: 1 }], [205, 420, 10, 'eel', { eel: [4.5, 0.5, 0.55], skin: 0 }], [250, 405, 10, 'eel', { eel: [4.5, 0.75, 0.55], skin: 1 }],
      [185, 348, 14, 'chest', { secret: 1, kick: 280 }]],
      targets: V(352, 330, 3, 'bone', 'A'),
      holes: [[40, 190, 'tunnel', 1, 150, 100], [330, 190, 'tunnel', 0, -150, 100]],
      missions: [{ k: 'eel', n: 8, t: 'アナゴたちに8回当てる' }, { k: 'hole', n: 3, t: '海底トンネルを3回くぐる' }, { k: 'score', n: 40000, t: '40,000点とる' }]
    },
    {
      id: 6, name: 'パグの宇宙旅行', desc: '重力が変わる！ワープゲートで瞬間移動',
      theme: { a: '#1a1040', b: '#3b2a7a', wall: '#7c6cf0', deco: 'space' },
      bgm: { bpm: 120, root: 57, scale: [0, 2, 3, 5, 7, 10], wave: 'sawtooth' },
      grav: [{ t: 12, gy: 1, gx: 0, label: '通常重力' }, { t: 8, gy: 0.4, gx: 0, label: '低重力！ふわふわ〜' }, { t: 12, gy: 1, gx: 0, label: '通常重力' }, { t: 7, gy: 0.9, gx: 0.2, label: '横向きの重力！' }],
      bumpers: [[110, 208, 24, 'planet', { c: 0 }], [258, 192, 19, 'planet', { c: 1 }], [185, 302, 28, 'planet', { c: 2, secret: 1 }], [292, 342, 15, 'planet', { c: 3 }], [72, 347, 15, 'planet', { c: 4 }]],
      targets: V(18, 240, 3, 'star', 'A'),
      holes: [[42, 160, 'warp', 1, 140, 120], [316, 440, 'warp', 0, -180, -380]],
      missions: [{ k: 'hole', n: 3, t: 'ワープゲートに3回入る' }, { k: 'bumper', n: 50, t: '惑星バンパーに50回当てる' }, { k: 'score', n: 80000, t: '80,000点とる' }]
    },
    {
      id: 7, name: 'パグのお菓子工場', desc: 'ドッグフードの連続ターゲットでコンボを伸ばせ',
      theme: { a: '#ffc9de', b: '#fff0b8', wall: '#b5651d', deco: 'candy' },
      bgm: { bpm: 140, root: 64, scale: [0, 2, 4, 7, 9], wave: 'square' },
      zones: [{ x: 14, y: 430, w: 342, h: 45, type: 'conv', ax: 300, alt: 6 }],
      bumpers: [[110, 208, 21, 'candy'], [260, 208, 21, 'candy'], [185, 252, 19, 'candy', { secret: 1 }], [185, 167, 15, 'food']],
      targets: [PEG(85, 335, 'food', 'A'), PEG(135, 335, 'food', 'A'), PEG(185, 335, 'food', 'A'), PEG(235, 335, 'food', 'A'), PEG(285, 335, 'food', 'A'),
      PEG(110, 385, 'food', 'B'), PEG(160, 385, 'food', 'B'), PEG(210, 385, 'food', 'B'), PEG(260, 385, 'food', 'B')],
      holes: [[42, 272, 'oven', null, 180, -60]],
      missions: [{ k: 'bank', n: 3, t: 'フードの列を3回そろえる' }, { k: 'combo5', n: 3, t: '5コンボを3回決める' }, { k: 'score', n: 100000, t: '100,000点とる' }]
    },
    {
      id: 8, name: 'パグの雪国', desc: 'つるつる氷の床。雪玉を大きくして割ろう',
      saveTime: 15, theme: { a: '#cfe9ff', b: '#f4fbff', wall: '#4a90c2', deco: 'snow' }, phys: { damp: 0, wallE: 0.5 },
      bgm: { bpm: 108, root: 65, scale: [0, 2, 4, 7, 9, 11], wave: 'triangle' },
      zones: [{ x: 60, y: 345, w: 250, h: 120, type: 'ice' }],
      bumpers: [[120, 215, 16, 'snow', { grow: [16, 28, 3] }], [250, 215, 16, 'snow', { grow: [16, 28, 3] }], [185, 290, 16, 'snow', { grow: [16, 30, 3.5], secret: 1 }]],
      rails: [{ pts: curve([[330, 210], [336, 300], [300, 380], [200, 420], [100, 440], [56, 470]], 40), kind: 'sled', score: 1000, speed: 520, exit: 260 }],
      targets: V(18, 240, 3, 'ice', 'A'), holes: [[58, 335, 'kamakura', null, 170, -120]],
      missions: [{ k: 'rail', n: 2, t: 'そりのコースを2回すべる' }, { k: 'burst', n: 2, t: '雪玉を2回割る' }, { k: 'score', n: 50000, t: '50,000点とる' }]
    },
    {
      id: 9, name: 'パグのミステリー城', desc: '1→4の順にターゲットを倒すと隠し扉が開く', saveTime: 15,
      theme: { a: '#3a2d52', b: '#6b5a8c', wall: '#b79cff', deco: 'castle' },
      bgm: { bpm: 100, root: 57, scale: [0, 2, 3, 5, 7, 8, 11], wave: 'triangle' },
      walls: [[160, 222, 160, 255, 185, 268, 210, 255, 210, 222]], doors: [[160, 222, 185, 208], [185, 208, 210, 222]], ordered: true, door: true,
      rails: [{ pts: curve([[185, 238], [150, 170], [70, 150], [36, 260], [40, 400], [56, 470]], 44), kind: 'secret', score: 2000, speed: 500, exit: 240, locked: true, jackpot: true, cap: 26 }],
      bumpers: [[90, 225, 20, 'plush'], [280, 225, 20, 'plush'], [185, 318, 18, 'cushion', { secret: 1 }]],
      targets: [PEG(72, 335, 'num', 'A', 1), PEG(298, 335, 'num', 'A', 2), PEG(120, 400, 'num', 'A', 3), PEG(250, 400, 'num', 'A', 4)],
      holes: [[316, 300, 'house', null, -170, 120]],
      missions: [{ k: 'bank', n: 1, t: '1→4の順にターゲットを倒す' }, { k: 'rail', n: 1, t: '隠し扉の秘密ルートを通る' }, { k: 'score', n: 40000, t: '40,000点とる' }]
    },
    {
      id: 10, name: 'パグ王国', desc: '最終ステージ。王様パグを30回たたいて倒せ！',
      theme: { a: '#7a1f3d', b: '#f6c453', wall: '#ffd24a', deco: 'kingdom' },
      bgm: { bpm: 126, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], wave: 'sawtooth' },
      grav: [{ t: 14, gy: 1, gx: 0, label: '通常重力' }, { t: 6, gy: 0.45, gx: 0, label: '王様の魔法で低重力！' }],
      bumpers: [[0, 0, 32, 'boss', { slide: [115, 215, 255, 215, 8, 0], boss: 30, kick: 600 }], [0, 0, 13, 'paw', { guard: [62, 1.6, 0] }], [0, 0, 13, 'paw', { guard: [62, 1.6, 3.14] }],
      [150, 425, 10, 'eel', { eel: [5, 0, 0.5], skin: 0 }], [220, 425, 10, 'eel', { eel: [5, 0.5, 0.5], skin: 1 }], [185, 335, 17, 'face', { secret: 1 }]],
      targets: [...V(18, 290, 3, 'bone', 'A'), ...V(352, 290, 3, 'bone', 'B')],
      rails: [{ pts: curve([[36, 450], [28, 330], [46, 210], [100, 150], [150, 140], [185, 162]], 40), kind: 'coaster', score: 1000, speed: 560, exit: 320 }],
      holes: [[316, 405, 'house', null, -190, -300]],
      missions: [{ k: 'boss', n: 1, t: '王様パグを倒す' }, { k: 'bank', n: 2, t: '骨ターゲットを2列倒す' }, { k: 'score', n: 200000, t: '200,000点とる' }]
    },
    {
      id: 11, name: 'ひみつのパグ天国', desc: '隠しステージ。金の肉球とごほうびフードがいっぱい', hidden: true, foodAlways: true, bowMul: 2,
      theme: { a: '#fff3b0', b: '#ffd6f0', wall: '#f5b942', deco: 'heaven' }, phys: { g: 880 },
      bgm: { bpm: 118, root: 67, scale: [0, 2, 4, 7, 9], wave: 'sine' },
      bumpers: [[185, 262, 20, 'face', { secret: 1 }], ...RING(185, 262, 76, 5, 17, 'gold')],
      targets: [...V(18, 300, 3, 'bone', 'A'), ...V(352, 300, 3, 'bone', 'B')],
      holes: [[312, 432, 'house', null, -200, -320]], spinners: [[58, 225]],
      missions: [{ k: 'score', n: 300000, t: '300,000点とる' }]
    }
  ];

  // ===== コレクション =====
  PP.PUGS = [
    { id: 'fawn', name: 'フォーンパグ', fur: 'fawn', price: 0, anim: 'bounce', say: 'いちばんふつうで、いちばんかわいい。' },
    { id: 'black', name: '黒パグ', fur: 'black', price: 300, anim: 'tilt', say: 'つやつやの黒い毛がじまん。' },
    { id: 'white', name: '白パグ', fur: 'white', price: 500, anim: 'nod', say: 'ましゅまろみたいな白パグ。' },
    { id: 'silver', name: 'シルバーパグ', fur: 'silver', price: 800, anim: 'wiggle', say: 'クールに見えて甘えんぼ。' },
    { id: 'apricot', name: 'レアパグ', fur: 'apricot', price: 1200, anim: 'bounce', say: 'めずらしいアプリコット色。' },
    { id: 'onsen', name: '温泉パグ', fur: 'fawn', acc: 'towel', price: 1500, anim: 'float', say: 'いい湯だな〜。' },
    { id: 'okinawa', name: '沖縄パグ', fur: 'fawn', acc: 'flower', price: 1500, anim: 'wiggle', say: 'なんくるないさ〜。' },
    { id: 'sweets', name: 'おかしパグ', fur: 'apricot', acc: 'candy', price: 1800, anim: 'nod', say: 'おやつは別腹。' },
    { id: 'ninja', name: '忍者パグ', fur: 'black', acc: 'band', price: 2000, anim: 'tilt', say: 'にんにん。' },
    { id: 'space', name: '宇宙パグ', fur: 'silver', acc: 'helmet', price: 2500, anim: 'float', say: '宇宙でもおやつは食べたい。' },
    { id: 'king', name: '王様パグ', fur: 'fawn', acc: 'crown', price: -1, how: '全ステージクリアの実績でもらえる', anim: 'nod', say: 'くるしゅうない。' },
    { id: 'phantom', name: 'まぼろしパグ', fur: 'ghost', acc: 'halo', price: -1, how: '隠しイベントを見つけるともらえる', anim: 'float', say: '見つけてくれてありがとう。' }
  ];
  PP.BALLS = [
    { id: 'normal', name: 'シルバー', c: ['#ffffff', '#c9ced6', '#7b828e'], price: 0 },
    { id: 'smile', name: 'ピンク', c: ['#fff0f6', '#ff9ec4', '#d6447f'], price: 200 },
    { id: 'sleepy', name: 'ブルー', c: ['#eef7ff', '#7fc4ff', '#2f7fc1'], price: 200 },
    { id: 'surprised', name: 'グリーン', c: ['#f0fff4', '#8fe3a0', '#2f9e5b'], price: 300 },
    { id: 'black', name: 'ブラック', c: ['#9a9aa6', '#44444c', '#17171a'], price: 400 },
    { id: 'white', name: 'パール', c: ['#ffffff', '#fbf4e6', '#d9cbb0'], price: 400 },
    { id: 'gold', name: 'ゴールド', c: ['#fffbe0', '#ffd84a', '#c58a00'], price: 1500 },
    { id: 'rainbow', name: 'レインボー', c: null, price: 3000 }
  ];
  PP.CUSTOM = {
    flipper: { name: 'しっぽの色', items: [{ id: 'fawn', name: 'フォーン', price: 0, c: '#e9c592', d: '#c99a5e' }, { id: 'black', name: 'ブラック', price: 300, c: '#3a3a42', d: '#1e1e24' }, { id: 'pink', name: 'ピンク', price: 300, c: '#ff9ec4', d: '#e06a9c' }, { id: 'gold', name: 'ゴールド', price: 800, c: '#ffd84a', d: '#d79a00' }] },
    effect: { name: 'エフェクト', items: [{ id: 'star', name: 'スター', price: 0 }, { id: 'heart', name: 'ハート', price: 300 }, { id: 'paw', name: '肉球', price: 300 }, { id: 'bone', name: 'ホネ', price: 300 }] },
    bumper: { name: 'バンパー', items: [{ id: 'default', name: 'ステージ標準', price: 0 }, { id: 'neon', name: 'ネオンリング', price: 500 }, { id: 'gold', name: 'ゴールドリング', price: 1000 }] },
    frame: { name: 'テーブル装飾', items: [{ id: 'theme', name: 'ステージ標準', price: 0 }, { id: 'pink', name: 'ピンクリボン', price: 400, c: '#ff7eb6' }, { id: 'navy', name: 'ネイビー', price: 400, c: '#2c3e73' }, { id: 'gold', name: 'ゴールド', price: 1200, c: '#f2b632' }] },
    bg: { name: '背景', items: [{ id: 'theme', name: 'ステージ標準', price: 0 }, { id: 'dark', name: 'くっきりダーク', price: 0 }, { id: 'dots', name: '水玉', price: 300 }, { id: 'stars', name: 'ほし空', price: 300 }] }
  };

  // ===== 実績（S=セーブデータ, R=直近の結果） =====
  PP.ACH = [
    { id: 'first', name: 'はじめの一歩', desc: 'はじめてプレイする', bow: 30, ok: S => S.plays >= 1 },
    { id: 's10k', name: '1万点パグ', desc: '1ゲームで10,000点', bow: 50, ok: S => S.stats.bestScore >= 10000 },
    { id: 's100k', name: '10万点パグ', desc: '1ゲームで100,000点', bow: 200, ok: S => S.stats.bestScore >= 100000 },
    { id: 's500k', name: '伝説のパグ', desc: '1ゲームで500,000点', bow: 500, ok: S => S.stats.bestScore >= 500000 },
    { id: 'c10', name: 'コンボ入門', desc: '10コンボ達成', bow: 50, ok: S => S.stats.bestCombo >= 10 },
    { id: 'c30', name: 'コンボ名人', desc: '30コンボ達成', bow: 150, ok: S => S.stats.bestCombo >= 30 },
    { id: 'c100', name: 'コンボの神', desc: '100コンボ達成', bow: 500, ok: S => S.stats.bestCombo >= 100 },
    { id: 'fever', name: 'パグフィーバー！', desc: 'パグフィーバーを発動', bow: 50, ok: S => S.stats.fever >= 1 },
    { id: 'multi', name: 'マルチボール成功', desc: 'マルチボールを発動', bow: 80, ok: S => S.stats.multiball >= 1 },
    { id: 'jp', name: 'ジャックポット', desc: 'ジャックポットを獲得', bow: 100, ok: S => S.stats.jackpot >= 1 },
    { id: 'sjp', name: 'スーパージャックポット', desc: 'スーパージャックポットを獲得', bow: 200, ok: S => S.stats.superjp >= 1 },
    { id: 'secret', name: '隠しルート発見', desc: '隠しイベントを見つける', bow: 150, ok: S => Object.keys(S.secrets).length >= 1 },
    { id: 'clear1', name: '街のヒーロー', desc: 'ステージ1をクリア', bow: 50, ok: S => !!S.cleared[1] },
    { id: 'clear5', name: '旅するパグ', desc: '5ステージをクリア', bow: 200, ok: S => Object.keys(S.cleared).filter(k => k <= 10).length >= 5 },
    { id: 'clearAll', name: 'パグ王国の勇者', desc: '全10ステージをクリア', bow: 500, pug: 'king', ok: S => Object.keys(S.cleared).filter(k => k <= 10).length >= 10 },
    { id: 'boss', name: '王様に勝った', desc: '王様パグを倒す', bow: 300, ok: S => S.stats.boss >= 1 },
    { id: 'pug5', name: 'パグ好き', desc: 'パグを5種類集める', bow: 100, ok: S => S.pugs.length >= 5 },
    { id: 'pug10', name: 'パグコレクター', desc: 'パグを10種類集める', bow: 500, ok: S => S.pugs.length >= 10 },
    { id: 'day3', name: 'まいにちパグ', desc: '1日に3回プレイ', bow: 60, ok: S => S.daily && S.daily.plays >= 3 },
    { id: 'lv5', name: 'レベル5', desc: 'プレイヤーレベル5', bow: 100, ok: S => S.level >= 5 },
    { id: 'lv10', name: 'レベル10', desc: 'プレイヤーレベル10', bow: 300, ok: S => S.level >= 10 },
    { id: 'bump1k', name: '肉球マスター', desc: 'バンパーに通算1,000回当てる', bow: 200, ok: S => S.stats.bumpers >= 1000 }
  ];

  // 初回遭遇ヒント
  PP.HINTS = {
    bumper: 'バンパー：当てるとはずんで得点！', target: 'ターゲット：1列ぜんぶ倒すとジャックポット点灯',
    gate: 'P・U・G のレーンを3つ光らせると「パグ大集合」', hole: '穴に入るとルーレット。点灯中はジャックポット！',
    rail: 'レール：乗るだけで高得点', spinner: 'パグ顔スピナー：速く通るほど高得点',
    eel: 'アナゴたちは出たり引っこんだり。出ている時に当てよう', zone_water: 'お湯の中はボールがゆっくり動く',
    zone_ice: '氷の上はスピードアップ！', zone_conv: '流れに押されてボールが横に動く', grav: '重力が変わるステージ。画面の表示に注目',
    boss: '王様パグ：30回たたくと倒せる', sling: 'しっぽの上の三角はボールをはじき返す', food: 'フードを拾うと得点とバウ',
    save: 'ボールセーブ中は落ちても戻ってくる', combo: '続けて当てるとコンボ。10コンボでパグフィーバー！', bonus: 'ボーナスゲート：通ると1,000点'
  };
  PP.EVENT_HELP = [
    ['コンボ', '1.3秒以内に続けて当てると発生。2コンボ×1.5、3コンボ×2、5コンボ×3'],
    ['パグフィーバー', '10コンボで発動。12秒間 得点2倍＋ボールが2個増える'],
    ['マルチボール', 'ターゲットの列を3回そろえるごとにボールが2個増える'],
    ['ジャックポット', 'ターゲットを1列そろえると点灯。穴に入れると5,000点'],
    ['スーパージャックポット', 'ボールが2個以上ある時にジャックポットを取ると15,000点'],
    ['パグ大集合', '上の P・U・G レーンを全部光らせる。3,000点＋12秒間 得点2倍。2回目でエクストラボール'],
    ['肉球ラッシュ', 'バンパーに25回当てるごとに発動。12秒間バンパー得点3倍'],
    ['巨大ボール', '穴のルーレットで当たり。15秒間ボールが大きくなり得点2倍'],
    ['ドッグフードボーナス', '穴のルーレットで当たり。フードが出現、1個300点＋1バウ'],
    ['隠しイベント', 'キラキラ光るバンパーだけに3回連続で当てる。場所はステージごとに違う'],
    ['ボーナスタイム', 'ステージクリアで20秒間、ボールが落ちても戻ってくる'],
    ['エクストラボール', '150,000点到達、またはパグ大集合2回目で残りボール+1']
  ];
})();
