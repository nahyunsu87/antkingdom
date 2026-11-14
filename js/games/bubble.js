// 비눗방울 팡 — 팔 뻗기. 몸 주변에 뜬 비눗방울을 손이든 머리든 닿으면 터진다. 사라지지 않고 기다려 준다.
export default {
  id: 'bubble', title: '비눗방울 팡', emoji: '🫧', color: '#7fd8ff', duration: 35,

  start() { return { list: [], next: 0.3 }; },

  update(s, dt, c) {
    const ps = c.present();
    s.next -= dt;
    if (s.next <= 0 && ps.length && s.list.length < ps.length * 3) {
      s.next = 0.5;
      const p = ps[Math.floor(Math.random() * ps.length)], r = Math.max(c.H * 0.08, p.sw * 0.55), reach = p.sw * 2.2;
      for (let tries = 0; tries < 8; tries++) {
        const x = Math.min(c.W - r, Math.max(r, p.shoulder.x + (Math.random() * 2 - 1) * reach));
        const y = Math.min(c.H * 0.85, Math.max(c.H * 0.2 + r, p.shoulder.y + (Math.random() * 1.5 - 1.0) * reach * 0.8));
        if (c.touching(x, y, r * 1.6, true)) continue; // 몸 바로 위에는 만들지 않음
        s.list.push({ x, y, r, age: 0, ph: Math.random() * 7 });
        break;
      }
    }
    for (const b of s.list) {
      b.age += dt; b.y -= dt * c.H * 0.012; // 아주 천천히 떠오름
      if (b.age > 0.25 && c.touching(b.x, b.y, b.r, true)) { b.dead = true; c.sfx.pop(); c.add(1, b.x, b.y, '#7fd8ff'); }
      else if (b.age > 8 || b.y < c.H * 0.16) b.dead = true; // 아무도 못 닿는 곳이면 조용히 사라지고 새로 생김
    }
    s.list = s.list.filter(b => !b.dead);
  },

  draw(s, g, c) {
    for (const b of s.list) {
      const k = Math.min(1, b.age / 0.2), x = b.x + Math.sin(c.t * 2 + b.ph) * b.r * 0.12;
      c.sprite('bubble', '🫧', x, b.y, b.r * 2.2 * k);
      g.beginPath(); g.arc(x, b.y, b.r * k, 0, 7); g.lineWidth = c.u * 0.5; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
    }
  },
};
