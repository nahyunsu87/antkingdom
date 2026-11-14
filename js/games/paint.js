// 손으로 색칠 — 팔 크게 휘두르기. 손이 지나간 자리에 무지개 물감이 칠해진다. 화면이 많이 칠해지면 칭찬하고 새 도화지.
const CX = 16, CY = 9, SC = 3; // CX×CY: 얼마나 칠했는지 세는 칸. SC: 물감 캔버스를 1/3 크기로(가볍게)

export default {
  id: 'paint', title: '손으로 색칠', emoji: '🎨', color: '#ffb347', duration: 40,

  start(c) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(c.W / SC); cv.height = Math.ceil(c.H / SC);
    return { cv, pg: cv.getContext('2d'), prev: {}, cells: new Uint8Array(CX * CY), count: 0, newly: 0, hue: Math.random() * 360, wait: 0 };
  },

  update(s, dt, c) {
    s.hue = (s.hue + dt * 50) % 360;
    if (s.wait > 0) {
      s.wait -= dt;
      if (s.wait <= 0) { s.pg.clearRect(0, 0, s.cv.width, s.cv.height); s.cells.fill(0); s.count = 0; }
      return;
    }
    const pg = s.pg; pg.lineCap = 'round'; pg.lineJoin = 'round';
    c.players.forEach((p, i) => p.hands.forEach((h, k) => {
      const key = i * 2 + k;
      if (!p.present || h.v < 0.4) { s.prev[key] = null; return; }
      const pt = { x: h.x / SC, y: h.y / SC }, pr = s.prev[key];
      const link = pr && Math.hypot(pr.x - pt.x, pr.y - pt.y) < p.sw * 3 / SC; // 인식이 튄 큰 점프는 잇지 않는다
      const color = `hsl(${(s.hue + key * 70) % 360},95%,60%)`;
      pg.strokeStyle = color; pg.lineWidth = p.sw * 0.5 / SC;
      pg.beginPath(); pg.moveTo(link ? pr.x : pt.x - 0.1, link ? pr.y : pt.y); pg.lineTo(pt.x, pt.y); pg.stroke();
      const steps = link ? 4 : 1;
      for (let j = 1; j <= steps; j++) {
        const x = link ? pr.x + (pt.x - pr.x) * j / steps : pt.x, y = link ? pr.y + (pt.y - pr.y) * j / steps : pt.y;
        const gx = Math.floor(x * SC / c.W * CX), gy = Math.floor(y * SC / c.H * CY);
        if (gx < 0 || gy < 0 || gx >= CX || gy >= CY || s.cells[gy * CX + gx]) continue;
        s.cells[gy * CX + gx] = 1; s.count++;
        if (++s.newly % 6 === 0) c.add(1, h.x, h.y, color);
      }
      s.prev[key] = pt;
    }));
    if (s.count / s.cells.length > 0.55) {
      s.wait = 3; c.add(3, c.W / 2, c.H / 2, '#ffd23f'); c.fx(c.W / 2, c.H / 2, '#ff9ad5', 30, 2, 0.9);
      c.say('paint_done', true); c.sfx.cheer();
    }
  },

  draw(s, g, c) {
    g.globalAlpha = 0.88; g.drawImage(s.cv, 0, 0, c.W, c.H); g.globalAlpha = 1;
    for (const p of c.present()) for (const h of p.hands) if (h.v > 0.4) c.sprite('brush', '🖌️', h.x, h.y, p.sw * 0.6);
  },
};
