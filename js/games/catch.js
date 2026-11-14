// 별 받기 — 좌우 이동. 천천히 떨어지는 별을 몸 어디로든 받는다. 피해야 할 것은 없다.
export default {
  id: 'catch', title: '별 받기', emoji: '⭐', color: '#ffd23f', duration: 35,

  start() { return { list: [], next: 0.3 }; },

  update(s, dt, c) {
    const ps = c.present();
    s.next -= dt;
    if (s.next <= 0 && ps.length) {
      s.next = 1.1 / ps.length;
      const p = ps[Math.floor(Math.random() * ps.length)], r = Math.max(c.H * 0.07, p.sw * 0.5);
      // 아이 근처(한두 걸음 거리)에 떨어뜨린다. 너무 멀면 포기한다.
      const x = Math.min(c.W - r, Math.max(r, p.cx + (Math.random() * 2 - 1) * p.sw * 3));
      s.list.push({ x, y: c.H * 0.16, r, vy: c.H * 0.2, spin: Math.random() * 7 });
    }
    for (const it of s.list) {
      it.y += it.vy * dt;
      if (c.touching(it.x, it.y, it.r, true)) { it.dead = true; c.sfx.hit(4); c.add(1, it.x, it.y, '#ffd23f'); }
      else if (it.y > c.H + it.r) it.dead = true;
    }
    s.list = s.list.filter(it => !it.dead);
  },

  draw(s, g, c) {
    for (const it of s.list) c.sprite('star', '⭐', it.x + Math.sin(c.t * 3 + it.spin) * it.r * 0.2, it.y, it.r * 2);
  },
};
