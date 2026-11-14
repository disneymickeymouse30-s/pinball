/* PUG PINBALL WORLD - サウンド（WebAudioでその場で合成するオリジナル音。音声ファイル不要） */
(function () {
  'use strict';
  const PP = window.PP;
  const A = PP.Audio = {
    ctx: null, bgmV: 0.5, sfxV: 0.8, last: {}, cfg: null, timer: null, step: 0, nextT: 0, feverOn: false, pat: null,
    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC();
          this.gS = this.ctx.createGain(); this.gB = this.ctx.createGain(); this.gS.connect(this.ctx.destination); this.gB.connect(this.ctx.destination); this.setVol(this.bgmV, this.sfxV);
          const n = this.ctx.sampleRate * 0.5; this.noiseBuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { this.ctx = null; }
    },
    setVol(b, s) { this.bgmV = b; this.sfxV = s; if (this.ctx) { this.gB.gain.value = b * 0.22; this.gS.gain.value = s * 0.5; } },
    suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }, resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(f, dur, type, vol, f2, when, out) {
      const c = this.ctx; if (!c) return; const t = (when || c.currentTime), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.3, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out || this.gS); o.start(t); o.stop(t + dur + 0.03);
    },
    noise(dur, vol, freq, when, out) {
      const c = this.ctx; if (!c) return; const t = when || c.currentTime, s = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter();
      s.buffer = this.noiseBuf; fl.type = 'bandpass'; fl.frequency.value = freq || 2000; g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(out || this.gS); s.start(t); s.stop(t + dur + 0.02);
    },
    bark(when, pitch) { const c = this.ctx; if (!c) return; const t = when || c.currentTime, p = pitch || 1; this.tone(430 * p, 0.1, 'sawtooth', 0.32, 250 * p, t); this.tone(860 * p, 0.07, 'square', 0.1, 500 * p, t); this.noise(0.06, 0.15, 1200, t); },
    arp(notes, step, type, vol) { const c = this.ctx; if (!c) return; notes.forEach((n, i) => this.tone(n, step * 1.8, type || 'triangle', vol || 0.28, 0, c.currentTime + i * step)); },
    sfx(name, p) {
      const c = this.ctx; if (!c || this.sfxV <= 0) return; const now = c.currentTime; if (this.last[name] && now - this.last[name] < 0.04) return; this.last[name] = now;
      switch (name) {
        case 'launch': this.tone(180, 0.3, 'sawtooth', 0.22, 950); this.noise(0.2, 0.15, 900); break;
        case 'flip': this.tone(170, 0.08, 'sine', 0.35, 340); this.noise(0.03, 0.12, 2500); break;
        case 'bumper': { const sc = [523, 587, 659, 784, 880, 1047], f = sc[Math.floor(Math.random() * sc.length)] * (p && p > 700 ? 1.2 : 1); this.tone(f, 0.11, 'triangle', 0.3, f * 0.72); this.tone(f * 2, 0.05, 'sine', 0.12); break; }
        case 'target': this.tone(740, 0.06, 'square', 0.16); this.tone(1110, 0.09, 'square', 0.16, 0, now + 0.06); break;
        case 'gate': this.tone(988, 0.12, 'sine', 0.26); this.tone(1319, 0.14, 'sine', 0.2, 0, now + 0.07); break;
        case 'combo': { const n = Math.min(p || 2, 14); this.tone(440 * Math.pow(2, n / 12), 0.09, 'square', 0.13); break; }
        case 'sling': this.tone(300, 0.07, 'square', 0.14, 520); break;
        case 'wall': this.noise(0.03, Math.min(0.2, (p || 300) / 5000), 1500 + Math.min(2500, p || 0)); break;
        case 'hole': this.tone(330, 0.25, 'sine', 0.3, 110); break;
        case 'eject': this.tone(160, 0.14, 'sine', 0.3, 520); break;
        case 'rail': this.tone(400, 0.5, 'sawtooth', 0.12, 1200); break;
        case 'food': this.tone(1320, 0.06, 'sine', 0.22); this.tone(1760, 0.09, 'sine', 0.2, 0, now + 0.05); break;
        case 'spin': this.tone(660, 0.05, 'triangle', 0.16, 990); break;
        case 'bark': this.bark(); break;
        case 'bark2': this.bark(now, 1.1); this.bark(now + 0.16, 1.25); break;
        case 'fever': this.arp([523, 659, 784, 1047, 1319, 1568], 0.07, 'square', 0.2); this.bark(now + 0.45, 1.2); this.bark(now + 0.6, 1.35); break;
        case 'jackpot': this.arp([784, 988, 1175, 1568, 1976], 0.06, 'triangle', 0.3); this.bark(now + 0.35, 1.3); break;
        case 'clear': this.arp([523, 523, 659, 784, 1047, 784, 1047], 0.12, 'triangle', 0.32); break;
        case 'levelup': this.arp([659, 784, 988, 1319], 0.09, 'square', 0.2); break;
        case 'extra': this.arp([880, 1109, 1319, 1760], 0.08, 'sine', 0.3); break;
        case 'drain': this.tone(420, 0.55, 'triangle', 0.3, 110); this.tone(300, 0.3, 'sine', 0.2, 150, now + 0.25); break;
        case 'saved': this.tone(520, 0.1, 'sine', 0.25, 780); break;
        case 'over': this.arp([392, 349, 311, 262], 0.2, 'triangle', 0.3); break;
        case 'ui': this.tone(700, 0.05, 'sine', 0.2); break;
        case 'buy': this.arp([988, 1319, 1976], 0.06, 'sine', 0.26); break;
        case 'ng': this.tone(200, 0.15, 'square', 0.15, 150); break;
        case 'boss': this.tone(140, 0.15, 'sawtooth', 0.3, 80); this.bark(now + 0.05, 0.7); break;
      }
    },
    // ----- BGM：ステージごとの音階とテンポから自動でメロディを作る -----
    bgm(cfg) {
      if (this.timer) { clearInterval(this.timer); this.timer = null; } this.cfg = cfg; if (!cfg || !this.ctx) return;
      let h = cfg.root * 7919 + cfg.bpm; const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
      const pat = []; let deg = 2; for (let i = 0; i < 64; i++) { if (i % 16 === 0) deg = [2, 4, 3, 2][(i / 16) | 0]; const r = rnd(); if (i % 2 === 1 && r < 0.45) { pat.push(null); continue; } deg += r < 0.35 ? -1 : r < 0.7 ? 1 : r < 0.85 ? 2 : -2; deg = Math.max(0, Math.min(cfg.scale.length * 2 - 1, deg)); pat.push(deg); }
      this.pat = pat; this.step = 0; this.nextT = this.ctx.currentTime + 0.1; this.timer = setInterval(() => this.tick(), 70);
    },
    tick() {
      const c = this.ctx, cfg = this.cfg; if (!c || !cfg || c.state !== 'running' || this.bgmV <= 0) { if (c) this.nextT = c.currentTime + 0.1; return; }
      if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.05;
      const spb = 60 / (cfg.bpm * (this.feverOn ? 1.22 : 1)) / 2, sc = cfg.scale, hz = m => 440 * Math.pow(2, (m - 69) / 12);
      while (this.nextT < c.currentTime + 0.22) {
        const i = this.step % 64, t = this.nextT, d = this.pat[i];
        if (d != null) { const m = cfg.root + 12 + sc[d % sc.length] + 12 * Math.floor(d / sc.length) + (this.feverOn ? 12 : 0), sn = cfg.wave === 'sanshin'; this.tone(hz(m), sn ? 0.22 : spb * 1.6, sn ? 'sawtooth' : cfg.wave, sn ? 0.5 : cfg.wave === 'sine' || cfg.wave === 'triangle' ? 0.6 : 0.3, sn ? hz(m) * 0.985 : 0, t, this.gB); }
        if (i % 4 === 0) { const bd = [0, 0, 3, 4, 0, 0, 2, 4][(i / 8) | 0] % sc.length; this.tone(hz(cfg.root - 12 + sc[bd]), spb * 3, 'triangle', 0.8, 0, t, this.gB); }
        if (i % 2 === 1) this.noise(0.03, this.feverOn ? 0.25 : 0.12, 6000, t, this.gB);
        this.nextT += spb; this.step++;
      }
    },
    fever(on) { this.feverOn = on; }
  };
})();
