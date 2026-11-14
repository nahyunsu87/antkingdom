// 불꽃놀이 — 만세(팔 위로 쭉). 두 손을 머리 위로 올리면 폭죽이 올라가 펑! 팔을 내렸다가 다시 올리면 또.
import { rand, clamp, pick, hint } from './util.js';
const COLS = ['#ff5d73', '#ffd23f', '#3fb6ff', '#7dff9b', '#ff9ad5', '#b45dff', '#ffffff'];

export default {
  id: 'firework', title: '불꽃놀이', emoji: '🎆', color: '#ff9ad5', duration: 40,

  start() { return { armed: [true, true], rockets: [], sparks: [], idle: 0, nagged: false }; },

  update(s, dt, c) {
    s.idle += dt;
    c.players.forEach((p, i) => {
      if (!p.present) return;
      const up = p.hands.every(h => h.v > 0.3 && h.y < p.nose.y);
      const down = p.hands.every(h => h.y > p.shoulder.y);
      if (s.armed[i] && up) {
        s.armed[i] = false; s.idle = 0; s.nagged = false;
        s.rockets.push({ x: clamp(p.cx + rand(-1, 1) * c.W * 0.08, c.W * 0.08, c.W * 0.92), y: c.H, ty: rand(c.H * 0.2, c.H * 0.38), color: pick(COLS) });
        c.sfx.whoosh();
      } else if (!s.armed[i] && down) s.armed[i] = true;
    });
    if (s.idle > 8 && !s.nagged) { s.nagged = true; c.say('firework', true); }
    for (const r of s.rockets) {
      r.y -= c.H * 1.3 * dt;
      if (r.y > r.ty) continue;
      r.dead = true;
      for (let k = 0; k < 45; k++) {
        const a = k / 45 * Math.PI * 2 + rand(-0.1, 0.1), v = rand(0.25, 0.5) * c.H;
        s.sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(1, 1.6), color: k % 3 ? r.color : '#fff' });
      }
      c.add(1, r.x, r.y, r.color); c.sfx.boom();
    }
    s.rockets = s.rockets.filter(r => !r.dead);
    for (const p of s.sparks) {
      const f = 1 - Math.min(1, dt * 0.9);
      p.vx *= f; p.vy = p.vy * f + c.H * 0.3 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
    }
    s.sparks = s.sparks.filter(p => p.t < p.life).slice(-400);
  },

  draw(s, g, c) {
    for (const r of s.rockets) {
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = c.u * 0.6;
      g.beginPath(); g.moveTo(r.x, r.y + c.u * 9); g.lineTo(r.x, r.y); g.stroke();
      g.fillStyle = r.color; g.beginPath(); g.arc(r.x, r.y, c.u * 1.3, 0, 7); g.fill();
    }
    for (const p of s.sparks) {
      g.globalAlpha = 1 - p.t / p.life; g.fillStyle = p.color;
      g.beginPath(); g.arc(p.x, p.y, c.u * 0.9, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (s.idle > 4) hint(g, c, 'pose_up', '🙌');
  },
};
