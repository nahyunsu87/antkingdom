// 짝짝 박수 — 손뼉. 박수를 칠 때마다 바닥 풀밭에 꽃이 하나씩 핀다(쌓인다).
import { rand, pick, hint } from './util.js';
const FLOWERS = ['🌸', '🌼', '🌷', '🌻', '🌺'];

export default {
  id: 'clap', title: '짝짝 박수', emoji: '👏', color: '#ffd23f', duration: 40,

  start() { return { open: [true, true], cool: [0, 0], flowers: [], idle: 0 }; },

  update(s, dt, c) {
    s.idle += dt;
    c.players.forEach((p, i) => {
      s.cool[i] -= dt;
      if (!p.present || p.hands.some(h => h.v < 0.3)) return;
      const [a, b] = p.hands, d = Math.hypot(a.x - b.x, a.y - b.y) / p.sw;
      if (s.open[i] && d < 0.6 && s.cool[i] <= 0) { // 벌렸던 손이 모이면 박수 한 번
        s.open[i] = false; s.cool[i] = 0.2; s.idle = 0;
        c.sfx.clap(); c.add(1, (a.x + b.x) / 2, (a.y + b.y) / 2, pick(['#ff9ad5', '#ffd23f', '#7dff9b']));
        s.flowers.push({ x: rand(c.W * 0.04, c.W * 0.96), y: rand(c.H * 0.8, c.H * 0.97), t: 0, k: Math.floor(Math.random() * FLOWERS.length) });
        if (s.flowers.length > 40) s.flowers.shift();
      } else if (!s.open[i] && d > 1.2) s.open[i] = true;
    });
    for (const f of s.flowers) f.t += dt;
  },

  draw(s, g, c) {
    g.fillStyle = 'rgba(90,200,100,.45)'; g.fillRect(0, c.H * 0.84, c.W, c.H * 0.16);
    for (const f of s.flowers) {
      const k = Math.min(1, f.t / 0.35), b = 1 + Math.sin(Math.min(f.t, 1) * Math.PI * 3) * 0.15 * (1 - Math.min(f.t, 1));
      c.sprite('flower' + (f.k + 1), FLOWERS[f.k], f.x, f.y - c.u * 4 * k, c.u * 11 * k * b);
    }
    if (s.idle > 4) hint(g, c, 'icon_clap', '👏');
  },
};
