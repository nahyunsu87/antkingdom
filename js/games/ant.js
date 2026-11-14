// 개미 달리기 — 온몸 움직이기. 뛰든 춤추든 팔을 흔들든, 많이 움직일수록 개미가 빨리 집에 간다. 둘이 같이 한 마리를 민다.
const JOINTS = [0, 15, 16, 25, 26, 27, 28];
const LAP = 14; // 한 번 집에 가는 데 필요한 움직임 양. 줄이면 쉬워진다
export default {
  id: 'ant', title: '개미 달리기', emoji: '🐜', color: '#7dff9b', duration: 35,

  start() { return { prev: [null, null], pos: 0, speed: 0 }; },

  update(s, dt, c) {
    let energy = 0;
    c.players.forEach((p, i) => {
      if (!p.present) { s.prev[i] = null; return; }
      const cur = JOINTS.map(j => p.lm[j]);
      if (s.prev[i]) {
        let d = 0, n = 0;
        cur.forEach((q, k) => { if (q.v > 0.4) { d += Math.hypot(q.x - s.prev[i][k].x, q.y - s.prev[i][k].y); n++; } });
        if (n) energy += Math.min(0.6, d / n / p.torso); // 프레임당 관절 이동량(몸통 길이 대비). 튀는 값은 자른다
      }
      s.prev[i] = cur.map(q => ({ x: q.x, y: q.y }));
    });
    const v = energy < 0.012 ? 0 : energy / dt; // 가만히 서 있을 때의 떨림은 무시
    s.speed += (v - s.speed) * Math.min(1, dt * 4);
    s.pos += s.speed * dt;
    if (s.pos >= LAP) { s.pos = 0; c.sfx.cheer(); c.add(1, c.W * 0.9, c.H * 0.3, '#7dff9b'); c.say('arrive'); }
  },

  draw(s, g, c) {
    const { W, H, u } = c, x0 = W * 0.1, x1 = W * 0.9, y = H * 0.3, k = s.pos / LAP;
    g.lineCap = 'round'; g.lineWidth = u * 2.4;
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.strokeStyle = '#7dff9b'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (x1 - x0) * k, y); g.stroke();
    c.sprite('home', '🏠', x1, y - u * 5, u * 13);
    const hop = Math.abs(Math.sin(c.t * 14)) * Math.min(1, s.speed) * u * 2.5;
    c.sprite('ant', '🐜', x0 + (x1 - x0) * k, y - u * 5 - hop, u * 12);
  },
};
