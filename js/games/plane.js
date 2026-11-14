// 비행기 운전 — 몸 기울이기(균형). 팔을 벌리고 몸을 왼쪽·오른쪽으로 기울이면 비행기가 그쪽으로 간다. 떨어지는 별을 모은다.
// 팔을 안 벌려도 어깨 기울기로 움직인다. 둘이 하면 두 사람 기울기의 평균.
import { rand, clamp } from './util.js';

export default {
  id: 'plane', title: '비행기 운전', emoji: '✈️', color: '#a0b4ff', duration: 40,

  start(c) { return { x: c.W / 2, tilt: 0, items: [], lines: Array.from({ length: 12 }, () => ({ x: rand(0, c.W), y: rand(0, c.H) })), next: 0 }; },

  update(s, dt, c) {
    const ts = [];
    for (const p of c.present()) {
      const wide = p.hands.every(h => h.v > 0.3) && Math.abs(p.hands[0].x - p.hands[1].x) > p.sw * 1.8;
      const [a, b] = wide ? p.hands : [p.lm[11], p.lm[12]];
      const L = a.x < b.x ? a : b, R = a.x < b.x ? b : a;
      ts.push(Math.atan2(R.y - L.y, R.x - L.x)); // +: 화면 오른쪽이 내려감
    }
    const t = ts.length ? ts.reduce((x, y) => x + y) / ts.length : 0;
    s.tilt += (t - s.tilt) * Math.min(1, dt * 6);
    const v = Math.sign(s.tilt) * clamp((Math.abs(s.tilt) - 0.13) / 0.3, 0, 1) * c.W * 0.55; // 0.13rad(약 7°)까지는 무시: 그냥 서 있어도 몸은 조금 기울어 있다
    s.x = clamp(s.x + v * dt, c.W * 0.08, c.W * 0.92);

    s.next -= dt;
    if (s.next <= 0) { s.next = 0.8; const r = c.H * 0.06; s.items.push({ x: rand(c.W * 0.08, c.W * 0.92), y: c.H * 0.12, r }); }
    const py = c.H * 0.72;
    for (const it of s.items) {
      it.y += c.H * 0.28 * dt;
      if (Math.hypot(it.x - s.x, it.y - py) < it.r + c.u * 8) { it.dead = true; c.sfx.hit(4); c.add(1, it.x, it.y); }
      else if (it.y > c.H + it.r) it.dead = true;
    }
    s.items = s.items.filter(it => !it.dead);
    for (const l of s.lines) { l.y += c.H * 0.9 * dt; if (l.y > c.H) { l.y = -c.u * 10; l.x = rand(0, c.W); } }
  },

  draw(s, g, c) {
    const { H, u } = c;
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = u * 0.4;
    g.beginPath(); for (const l of s.lines) { g.moveTo(l.x, l.y); g.lineTo(l.x, l.y + u * 8); } g.stroke();
    for (const it of s.items) c.sprite('star', '⭐', it.x, it.y, it.r * 2);
    g.save(); g.translate(s.x, H * 0.72);
    g.rotate(s.tilt * 0.8 + (c.hasImage('plane') ? 0 : -Math.PI / 4)); // 이모지 ✈️ 는 오른쪽 위를 보고 있어 위로 돌린다
    c.sprite('plane', '✈️', 0, 0, u * 18);
    g.restore();
  },
};
