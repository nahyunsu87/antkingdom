// 풍선 통통 — 팔 위로 치기. 천천히 떨어지는 풍선을 손이나 머리로 쳐 올린다. 바닥에 떨어져도 위에서 조용히 새 풍선.
import { rand, clamp, pick } from './util.js';
const COLS = ['#ff5d73', '#ffd23f', '#3fb6ff', '#7dff9b', '#ff9ad5'];

function spawn(c, i) {
  const ps = c.present(), p = ps[i] || ps[0];
  const r = Math.max(c.H * 0.08, p ? p.sw * 0.55 : 0);
  const x = p ? clamp(p.cx + rand(-1, 1) * p.sw, r, c.W - r) : c.W * (0.35 + 0.3 * i);
  return { x, y: c.H * 0.16 + r, r, vx: 0, vy: 0, cool: 0.6, color: pick(COLS) };
}

export default {
  id: 'balloon', title: '풍선 통통', emoji: '🎈', color: '#ff6b8b', duration: 40,

  start() { return { list: [] }; },

  update(s, dt, c) {
    const want = clamp(c.present().length, 1, 2);
    while (s.list.length < want) s.list.push(spawn(c, s.list.length));
    s.list.forEach((b, i) => {
      b.cool -= dt;
      b.vy = Math.min(b.vy + c.H * 0.25 * dt, c.H * 0.2); // 최대 낙하 속도를 낮게: 아주 천천히 떨어진다
      b.vx *= 1 - Math.min(1, dt * 0.8);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
      if (b.x > c.W - b.r) { b.x = c.W - b.r; b.vx = -Math.abs(b.vx); }
      const top = c.H * 0.15 + b.r;
      if (b.y < top) { b.y = top; b.vy = Math.abs(b.vy) * 0.3; }
      const p = b.cool <= 0 && c.touching(b.x, b.y, b.r, true);
      if (p) {
        b.cool = 0.4; b.vy = -c.H * 0.65;
        b.vx = clamp((b.x - p.cx) / p.sw, -2, 2) * c.W * 0.08 + rand(-1, 1) * c.W * 0.03;
        c.sfx.boing(); c.add(1, b.x, b.y, b.color);
      }
      if (b.y > c.H + b.r * 2) s.list[i] = spawn(c, i);
    });
  },

  draw(s, g, c) {
    for (const b of s.list) {
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = c.u * 0.4;
      g.beginPath(); g.moveTo(b.x, b.y + b.r);
      for (let k = 1; k <= 4; k++) g.lineTo(b.x + Math.sin(c.t * 4 + k) * b.r * 0.15, b.y + b.r + k * b.r * 0.3);
      g.stroke();
      c.sprite('balloon', '🎈', b.x, b.y, b.r * 2.3);
    }
  },
};
