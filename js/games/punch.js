// 팡팡 펀치 — 팔·어깨. 몸 주변에 뜨는 표적을 손으로 친다. 폭탄은 치면 감점.
const lerp = (a, b, k) => a + (b - a) * k;
export default {
  id: 'punch', title: '팡팡 펀치', desc: '표적을 손으로 팡!', emoji: '🥊', color: '#ff8a3d',
  how: '표적을 손으로 치세요 · 폭탄은 피하기', duration: 60, needs: 'upper',

  start() { return { targets: [], next: [0.5, 0.5], combo: [0, 0] }; },

  update(s, dt, c) {
    const k = c.t / c.dur; // 0→1 진행도: 갈수록 빨라진다
    for (let i = 0; i < c.n; i++) {
      const p = c.players[i], z = c.zones[i];
      if (!p.present) continue;
      s.next[i] -= dt;
      if (s.next[i] <= 0) {
        s.next[i] = lerp(0.9, 0.45, k);
        const r = Math.max(c.H * 0.065, p.sw * 0.45), reach = p.sw * 2.3;
        for (let tries = 0; tries < 6; tries++) {
          const x = Math.min(z.x + z.w - r, Math.max(z.x + r, p.shoulder.x + (Math.random() * 2 - 1) * reach));
          const y = Math.min(c.H - r, Math.max(c.H * 0.16 + r, p.shoulder.y + (Math.random() * 1.6 - 1.1) * reach * 0.9));
          if (p.hands.some(h => Math.hypot(h.x - x, h.y - y) < r * 2.5)) continue; // 손 바로 위에는 만들지 않음
          s.targets.push({ i, x, y, r, bomb: c.t > 8 && Math.random() < 0.18, age: 0, life: lerp(2.2, 1.3, k) });
          break;
        }
      }
    }
    for (const t of s.targets) {
      const p = c.players[t.i];
      t.age += dt;
      if (p.present && t.age > 0.15 && p.hands.some(h => Math.hypot(h.x - t.x, h.y - t.y) < t.r + p.sw * 0.2)) {
        t.dead = true;
        if (t.bomb) { c.score[t.i] = Math.max(0, c.score[t.i] - 20); s.combo[t.i] = 0; c.sfx.bad(); c.pop(t.x, t.y, '-20', '#ff5d73'); }
        else { const pts = 10 + Math.min(s.combo[t.i], 10); c.score[t.i] += pts; c.sfx.hit(s.combo[t.i]++); c.pop(t.x, t.y, '+' + pts); }
      } else if (t.age > t.life) { t.dead = true; if (!t.bomb) s.combo[t.i] = 0; }
    }
    s.targets = s.targets.filter(t => !t.dead);
  },

  draw(s, g, c) {
    for (const t of s.targets) {
      const left = 1 - t.age / t.life, pop = Math.min(1, t.age / 0.12);
      g.beginPath(); g.arc(t.x, t.y, t.r * 1.15, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2);
      g.lineWidth = t.r * 0.14; g.strokeStyle = t.bomb ? '#ff5d73' : '#ffd23f'; g.stroke();
      c.sprite(t.bomb ? 'bomb' : 'target', t.bomb ? '💣' : '🎯', t.x, t.y, t.r * 2 * pop);
    }
    for (let i = 0; i < c.n; i++) if (s.combo[i] >= 3) c.text(`${s.combo[i]} 콤보!`, c.zones[i].cx, c.H * 0.2, c.u * 5, '#ffd23f');
  },
};
