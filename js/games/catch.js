// 별 받기 — 좌우 이동(사이드 스텝). 떨어지는 별은 몸으로 받고 돌은 피한다. 손이 아니라 가슴 위치로 판정.
const lerp = (a, b, k) => a + (b - a) * k;
export default {
  id: 'catch', title: '별 받기', desc: '좌우로 움직여 별 받기', emoji: '⭐', color: '#ffd23f',
  how: '좌우로 움직여 별은 받고 돌은 피하기', duration: 60, needs: 'upper',

  start() { return { items: [], next: [0.5, 0.5] }; },

  update(s, dt, c) {
    const k = c.t / c.dur;
    for (let i = 0; i < c.n; i++) {
      const p = c.players[i], z = c.zones[i];
      s.next[i] -= dt;
      if (s.next[i] > 0 || !p.present) continue;
      s.next[i] = lerp(1.1, 0.55, k);
      const r = Math.max(c.H * 0.055, p.sw * 0.4), m = r + z.w * 0.06;
      let x = z.x + m + Math.random() * (z.w - m * 2);
      const rock = Math.random() < lerp(0.2, 0.35, k);
      if (!rock && Math.abs(x - p.cx) < p.sw) x = p.cx < z.cx ? z.x + z.w - m - Math.random() * z.w * 0.25 : z.x + m + Math.random() * z.w * 0.25; // 별은 움직여야 받게
      s.items.push({ i, x, y: c.H * 0.14, r, rock, vy: c.H * lerp(0.32, 0.55, k) });
    }
    for (const it of s.items) {
      const p = c.players[it.i];
      it.y += it.vy * dt;
      const chest = { x: p.shoulder.x, y: (p.shoulder.y + p.hip.y) / 2 };
      const hit = p.present && [chest, p.nose].some(q => Math.hypot(q.x - it.x, q.y - it.y) < it.r + p.sw * 0.6);
      if (hit) {
        it.dead = true;
        if (it.rock) { c.score[it.i] = Math.max(0, c.score[it.i] - 15); c.sfx.bad(); c.pop(it.x, it.y, '-15', '#ff5d73'); }
        else { c.score[it.i] += 10; c.sfx.hit(3); c.pop(it.x, it.y, '+10'); }
      } else if (it.y > c.H + it.r) it.dead = true;
    }
    s.items = s.items.filter(it => !it.dead);
  },

  draw(s, g, c) {
    for (let i = 0; i < c.n; i++) { // 판정 범위 표시
      const p = c.players[i]; if (!p.present) continue;
      g.beginPath(); g.arc(p.shoulder.x, (p.shoulder.y + p.hip.y) / 2, p.sw * 0.6, 0, 7);
      g.lineWidth = c.u * 0.6; g.strokeStyle = 'rgba(255,255,255,.6)'; g.setLineDash([c.u, c.u]); g.stroke(); g.setLineDash([]);
    }
    for (const it of s.items) c.sprite(it.rock ? 'rock' : 'star', it.rock ? '🪨' : '⭐', it.x, it.y, it.r * 2);
  },
};
