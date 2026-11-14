// 개구리 점프 — 스쿼트. 앉았다 일어날 때마다 개구리가 연잎을 하나씩 폴짝. 끝 연잎에 닿으면 칭찬하고 처음부터.
// 둘이 하면 누가 앉았다 일어나도 같은 개구리가 뛴다(협동).
import { trackStand, hint } from './util.js';
const PADS = 6;
const padPos = (c, i) => ({ x: c.W * (0.1 + 0.8 * i / (PADS - 1)), y: c.H * 0.3 });

export default {
  id: 'frog', title: '개구리 점프', emoji: '🐸', color: '#7ee26b', duration: 40,

  start() { return { ref: [null, null], down: [false, false], pos: 0, from: 0, hop: 0, arrived: 0, idle: 0 }; },

  update(s, dt, c) {
    s.idle += dt; s.hop = Math.max(0, s.hop - dt);
    if (s.arrived > 0) { s.arrived -= dt; if (s.arrived <= 0) { s.pos = 0; s.from = 0; } }
    c.players.forEach((p, i) => {
      if (!p.present) { s.ref[i] = null; s.down[i] = false; return; }
      s.ref[i] = trackStand(s.ref[i], p, dt);
      const dy = (p.nose.y - s.ref[i]) / p.torso; // 서 있을 때보다 머리가 얼마나 내려왔나(몸통 길이 대비)
      if (!s.down[i] && dy > 0.35) s.down[i] = true;
      else if (s.down[i] && dy < 0.15) {
        s.down[i] = false;
        if (s.hop > 0.1 || s.arrived > 0) return; // 뛰는 중에는 무시(벌을 주지 않고 그냥 넘김)
        s.idle = 0; s.from = s.pos; s.pos++; s.hop = 0.5;
        const P = padPos(c, s.pos);
        c.sfx.boing(); c.add(1, P.x, P.y - c.u * 8, '#7ee26b');
        if (s.pos >= PADS - 1) { s.arrived = 2.2; c.say('frog_end', true); c.sfx.splash(); c.add(2, P.x, P.y, '#3fb6ff'); }
      }
    });
  },

  draw(s, g, c) {
    const { W, H, u } = c;
    g.fillStyle = 'rgba(63,150,255,.35)'; g.fillRect(0, H * 0.2, W, H * 0.2);
    for (let i = 0; i < PADS; i++) {
      const P = padPos(c, i);
      if (i === PADS - 1) { c.sprite('lotus', '🪷', P.x, P.y, u * 13); continue; }
      g.fillStyle = '#3fae4a'; g.beginPath(); g.ellipse(P.x, P.y + u * 3, u * 7, u * 3, 0, 0, 7); g.fill();
    }
    const A = padPos(c, s.from), B = padPos(c, s.pos), t = s.hop > 0 ? 1 - s.hop / 0.5 : 1;
    c.sprite('frog', '🐸', A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t - Math.sin(Math.PI * t) * H * 0.12, u * 14);
    if (s.idle > 4) hint(g, c, 'pose_small', '⬇️', W / 2, H * 0.6);
  },
};
