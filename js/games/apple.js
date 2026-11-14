// 사과 따기 — 위로 쭉 뻗기. 머리 위쪽(팔이 닿을 높이)에 열린 사과를 손으로 따면 바구니로 쏙.
import { rand, clamp, pick } from './util.js';

export default {
  id: 'apple', title: '사과 따기', emoji: '🍎', color: '#ff5d5d', duration: 40,

  start() { return { apples: [], flying: [], next: 0 }; },

  update(s, dt, c) {
    const ps = c.present();
    s.next -= dt;
    if (s.next <= 0 && ps.length && s.apples.length < 2 + ps.length * 2) {
      s.next = 0.5;
      const p = pick(ps), r = Math.max(c.H * 0.06, p.sw * 0.42);
      for (let tries = 0; tries < 8; tries++) {
        const x = clamp(p.cx + rand(-1, 1) * p.sw * 2.4, r, c.W - r);
        const y = clamp(p.nose.y - p.torso * rand(0.4, 1.1), c.H * 0.2 + r, c.H * 0.6); // 머리 위, 팔 뻗으면 닿는 높이
        if (s.apples.some(a => Math.hypot(a.x - x, a.y - y) < (a.r + r) * 1.1)) continue;
        if (c.touching(x, y, r * 1.5)) continue;
        s.apples.push({ x, y, r, age: 0, ph: rand(0, 7) });
        break;
      }
    }
    for (const a of s.apples) {
      a.age += dt;
      if (a.age > 0.3 && c.touching(a.x, a.y, a.r)) {
        a.dead = true; c.sfx.hit(5); c.add(1, a.x, a.y, '#ff5d5d');
        s.flying.push({ x0: a.x, y0: a.y, r: a.r, t: 0 });
      } else if (a.age > 12) a.dead = true; // 아무도 못 따면 조용히 사라지고 새로 열린다
    }
    s.apples = s.apples.filter(a => !a.dead);
    for (const f of s.flying) { f.t += dt; if (f.t > 0.7 && !f.done) { f.done = true; c.sfx.step(); } }
    s.flying = s.flying.filter(f => f.t < 0.75);
  },

  draw(s, g, c) {
    const { W, H, u } = c;
    g.fillStyle = 'rgba(70,180,90,.45)'; // 나뭇잎(화면 위쪽)
    for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(W * (i + 0.5) / 7, H * 0.1 + Math.sin(i * 2) * H * 0.04, W * 0.1, 0, 7); g.fill(); }
    for (const a of s.apples) {
      g.globalAlpha = clamp(12 - a.age, 0, 1);
      c.sprite('apple', '🍎', a.x + Math.sin(c.t * 2 + a.ph) * a.r * 0.08, a.y, a.r * 2.2 * Math.min(1, a.age / 0.25));
    }
    g.globalAlpha = 1;
    const bx = W - u * 14, by = H - u * 11;
    for (const f of s.flying) {
      const k = Math.min(1, f.t / 0.7);
      c.sprite('apple', '🍎', f.x0 + (bx - f.x0) * k, f.y0 + (by - f.y0) * k - Math.sin(k * Math.PI) * H * 0.15, f.r * 2 * (1 - k * 0.4));
    }
    c.sprite('basket', '🧺', bx, by, u * 18);
  },
};
