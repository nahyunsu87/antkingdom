// 공 차기 — 다리. 발 근처에 놓인 공을 발(무릎)로 차면 화면 끝 골대로 슝 → "골인!". 어느 쪽으로 차도 골인.
// 다리가 화면에 안 보이면 몸 어디로 건드려도 굴러간다(막히지 않게).
import { clamp, pick, hint } from './util.js';

function spawn(c, p) {
  const feet = p.ankles.filter(a => a.v > 0.3).map(a => a.y);
  const ground = clamp(feet.length ? Math.max(...feet) : p.hip.y + p.torso * 1.5, c.H * 0.5, c.H * 0.95);
  const r = Math.max(c.H * 0.05, p.sw * 0.42);
  const x = clamp(p.cx + pick([-1, 1]) * p.sw * 1.3, r + c.W * 0.12, c.W - r - c.W * 0.12);
  return { x, y: ground - r, ground: ground - r, r, vx: 0, vy: 0, state: 'rest', age: 0, spin: 0 };
}

export default {
  id: 'soccer', title: '공 차기', emoji: '⚽', color: '#ffffff', duration: 40,

  start() { return { ball: null, wait: 0.3 }; },

  update(s, dt, c) {
    const ps = c.present();
    if (!s.ball) { s.wait -= dt; if (s.wait <= 0 && ps.length) s.ball = spawn(c, pick(ps)); return; }
    const b = s.ball;
    b.age += dt; b.spin += b.vx / b.r * dt;
    if (b.state === 'rest') {
      if (b.age > 8) { s.ball = null; s.wait = 0.2; return; } // 아이가 멀어졌으면 가까이에 다시 놓는다
      if (b.age < 0.5) return;
      for (const p of ps) {
        const legs = [...p.knees, ...p.ankles].filter(q => q.v > 0.3);
        const hit = legs.length ? legs.find(q => Math.hypot(q.x - b.x, q.y - b.y) < b.r + p.sw * 0.35)
          : (c.touching(b.x, b.y, b.r, true) ? p.hip : null);
        if (!hit) continue;
        const dir = Math.sign(b.x - hit.x) || (b.x < c.W / 2 ? -1 : 1);
        b.vx = dir * c.W * 0.9; b.vy = -c.H * 0.7; b.state = 'fly';
        c.sfx.kick(); c.fx(b.x, b.y, '#ffffff', 8);
        break;
      }
    } else {
      b.vy += c.H * 1.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > b.ground) { b.y = b.ground; b.vy = -Math.abs(b.vy) * 0.5; }
      if (b.x < -b.r || b.x > c.W + b.r) {
        const gx = b.x < 0 ? c.u * 10 : c.W - c.u * 10, gy = b.ground - c.u * 8;
        c.say('goal', true); c.sfx.cheer(); c.add(1, gx, gy); c.fx(gx, gy, '#7dff9b', 20, 1.5, 0.8);
        s.ball = null; s.wait = 1;
      }
    }
  },

  draw(s, g, c) {
    const gy = s.ball ? s.ball.ground : c.H * 0.8;
    c.sprite('goal', '🥅', c.u * 10, gy - c.u * 6, c.u * 22);
    c.sprite('goal', '🥅', c.W - c.u * 10, gy - c.u * 6, c.u * 22);
    const b = s.ball;
    if (!b) return;
    g.save(); g.translate(b.x, b.y); g.rotate(b.spin); c.sprite('ball', '⚽', 0, 0, b.r * 2); g.restore();
    if (b.state === 'rest' && b.age > 2.5) hint(g, c, 'foot', '🦶', b.x, b.y - b.r * 2.6);
  },
};
