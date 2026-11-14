// 새처럼 날기 — 팔 퍼덕이기. 팔을 위에서 아래로 내릴 때마다 새가 위로 날아오르고, 가만히 있으면 천천히 내려온다.
// 날아오는 별에 닿으면 별 +1. 둘이 퍼덕이면 힘이 합쳐진다.
import { rand, clamp } from './util.js';

export default {
  id: 'bird', title: '새처럼 날기', emoji: '🐦', color: '#7fd8ff', duration: 40,

  start(c) {
    const clouds = Array.from({ length: 5 }, () => ({ x: rand(0, c.W), y: rand(c.H * 0.2, c.H * 0.7), s: rand(0.7, 1.3) }));
    return { y: c.H * 0.8, vy: 0, prev: {}, items: [], clouds, next: 0, flapT: 0, idle: 0, nagged: false };
  },

  update(s, dt, c) {
    s.idle += dt;
    let lift = 0;
    c.players.forEach((p, i) => p.hands.forEach((h, k) => {
      const key = i * 2 + k;
      if (!p.present || h.v < 0.3) { s.prev[key] = null; return; }
      if (s.prev[key] != null) { const dy = (h.y - s.prev[key]) / p.torso; if (dy > 0) lift += Math.min(dy, 0.3); } // 내리는 움직임만 센다
      s.prev[key] = h.y;
    }));
    const ground = c.H * 0.86, top = c.H * 0.2;
    if (lift > 0.02) { s.vy -= lift * c.H * 0.45; s.flapT = 0.3; s.idle = 0; s.nagged = false; } // 0.02 미만은 손 떨림
    s.flapT -= dt;
    s.vy = clamp(s.vy + c.H * 0.6 * dt, -c.H * 0.8, c.H * 0.3);
    s.y += s.vy * dt;
    if (s.y > ground) { s.y = ground; s.vy = 0; }
    if (s.y < top) { s.y = top; s.vy = Math.max(0, s.vy); }
    if (s.idle > 7 && !s.nagged) { s.nagged = true; c.say('bird', true); }

    s.next -= dt;
    if (s.next <= 0) { // 별은 왼쪽에서 날아온다. 높은 곳에 더 많이 → 퍼덕여야 받는다
      s.next = 0.9;
      const r = c.H * 0.055;
      s.items.push({ x: -r, y: top + Math.pow(Math.random(), 1.3) * (ground - top - c.H * 0.1), r });
    }
    const bx = c.W * 0.68;
    for (const it of s.items) {
      it.x += c.W * 0.2 * dt;
      if (Math.hypot(it.x - bx, it.y - s.y) < it.r + c.H * 0.07) { it.dead = true; c.sfx.hit(4); c.add(1, it.x, it.y); }
      else if (it.x > c.W + it.r) it.dead = true;
    }
    s.items = s.items.filter(it => !it.dead);
    for (const cl of s.clouds) { cl.x += c.W * 0.06 * cl.s * dt; if (cl.x > c.W + c.u * 15) { cl.x = -c.u * 15; cl.y = rand(c.H * 0.2, c.H * 0.7); } }
  },

  draw(s, g, c) {
    const { W, H, u } = c;
    g.globalAlpha = 0.7; for (const cl of s.clouds) c.sprite('cloud', '☁️', cl.x, cl.y, u * 16 * cl.s); g.globalAlpha = 1;
    g.fillStyle = 'rgba(90,200,100,.4)'; g.fillRect(0, H * 0.92, W, H * 0.08);
    for (const it of s.items) c.sprite('star', '⭐', it.x, it.y, it.r * 2);
    g.save(); g.translate(W * 0.68, s.y);
    g.rotate(clamp(-s.vy / H * 0.8, -0.4, 0.4)); // 왼쪽을 보는 새: 올라갈 때 부리가 위로
    g.scale(1, s.flapT > 0 ? 1 + Math.sin(c.t * 30) * 0.12 : 1);
    c.sprite('bird', '🐦', 0, 0, u * 15);
    g.restore();
  },
};
