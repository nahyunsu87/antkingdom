// 까꿍 — 두 손으로 얼굴을 가렸다가 떼면 "까꿍!" 하고 동물 친구가 튀어나온다.
import { clamp, hint } from './util.js';
const ANIMALS = [['peek1', '🐶'], ['peek2', '🐱'], ['peek3', '🐰'], ['peek4', '🐻'], ['peek5', '🐼'], ['peek6', '🐥']];

export default {
  id: 'peekaboo', title: '까꿍', emoji: '🙈', color: '#ffb3c7', duration: 40,

  start() { return { hidden: [false, false], hold: [0, 0], pops: [], n: 0, idle: 0 }; },

  update(s, dt, c) {
    s.idle += dt;
    c.players.forEach((p, i) => {
      if (!p.present) { s.hold[i] = 0; return; }
      // 얼굴을 가리면 손목 인식이 흐려질 수 있어 visibility 는 보지 않는다
      const near = p.hands.map(h => Math.hypot(h.x - p.nose.x, h.y - p.nose.y) / p.sw);
      if (near[0] < 0.9 && near[1] < 0.9) { s.hold[i] += dt; if (s.hold[i] > 0.4) s.hidden[i] = true; return; }
      s.hold[i] = 0;
      if (!s.hidden[i] || Math.min(...near) < 1.1) return;
      s.hidden[i] = false; s.idle = 0;
      const side = p.cx < c.W / 2 ? 1 : -1;
      const x = clamp(p.cx + side * p.sw * 2.4, c.W * 0.12, c.W * 0.88), y = clamp(p.nose.y, c.H * 0.3, c.H * 0.7);
      s.pops.push({ x, y, t: 0, a: ANIMALS[s.n++ % ANIMALS.length], size: Math.max(c.H * 0.28, p.sw * 2.2) });
      c.say('peek', true); c.sfx.cheer(); c.add(1, x, y, '#ff9ad5');
    });
    s.pops = s.pops.filter(p => (p.t += dt) < 2.2);
  },

  draw(s, g, c) {
    c.players.forEach((p, i) => { if (p.present && s.hidden[i]) c.sprite('hide', '🙈', p.nose.x, p.nose.y - p.sw * 1.5, p.sw * 1.2); });
    for (const p of s.pops) {
      const k = p.t < 0.3 ? 1 + Math.sin(p.t / 0.3 * Math.PI) * 0.25 : 1; // 튀어나오며 커졌다 제자리
      g.globalAlpha = clamp((2.2 - p.t) / 0.4, 0, 1);
      c.sprite(p.a[0], p.a[1], p.x, p.y, p.size * Math.min(1, p.t / 0.15) * k);
    }
    g.globalAlpha = 1;
    if (s.idle > 4) hint(g, c, 'icon_peekaboo', '🙈');
  },
};
