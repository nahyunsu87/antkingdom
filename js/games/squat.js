// 스쿼트 점프 — 하체. 위쪽 레이저는 앉아서, 바닥 레이저는 뛰어서 피한다.
// 기준 자세(서 있는 코·골반 높이)는 게임 시작 순간에 잰다. 판정은 발사 구간 중 한 번이라도 성공하면 통과(미러링 지연 감안).
const lerp = (a, b, k) => a + (b - a) * k;
export default {
  id: 'squat', title: '스쿼트 점프', desc: '앉고 뛰어 레이저 피하기', emoji: '🦵', color: '#7dff9b',
  how: '위 레이저는 앉기 · 바닥 레이저는 점프', duration: 60, needs: 'full',

  start(c) {
    return { base: [null, null], beam: null, gap: 1.5, streak: [0, 0],
      snap(i) { const p = c.players[i]; if (p.present) this.base[i] = { nose: p.nose.y, hip: p.hip.y, torso: p.torso, foot: Math.max(p.ankles[0].y, p.ankles[1].y) }; } };
  },

  update(s, dt, c) {
    const k = c.t / c.dur;
    for (let i = 0; i < c.n; i++) if (!s.base[i]) s.snap(i);
    if (!s.beam) {
      s.gap -= dt;
      if (s.gap <= 0) { s.beam = { type: Math.random() < 0.6 ? 'duck' : 'jump', t: 0, warn: lerp(1.4, 0.9, k), fire: 0.5, ok: [false, false] }; c.sfx.warn(); }
      return;
    }
    const b = s.beam; b.t += dt;
    if (b.t > b.warn - 0.15) for (let i = 0; i < c.n; i++) {
      const p = c.players[i], base = s.base[i];
      if (!p.present || !base) continue;
      if (b.type === 'duck' ? p.nose.y > base.nose + base.torso * 0.45 : p.hip.y < base.hip - base.torso * 0.12) b.ok[i] = true;
    }
    if (b.t > b.warn + b.fire) {
      for (let i = 0; i < c.n; i++) {
        const p = c.players[i]; if (!s.base[i]) continue;
        if (b.ok[i]) { const pts = 10 + Math.min(s.streak[i]++, 5) * 2; c.score[i] += pts; c.sfx.hit(s.streak[i]); c.pop(p.cx, p.shoulder.y, '+' + pts); }
        else { s.streak[i] = 0; c.sfx.bad(); c.pop(p.cx, p.shoulder.y, '앗!', '#ff5d73'); }
      }
      s.beam = null; s.gap = lerp(1.1, 0.5, k);
    }
  },

  draw(s, g, c) {
    const b = s.beam;
    for (let i = 0; i < c.n; i++) {
      const z = c.zones[i], base = s.base[i];
      if (!base) { c.text('카메라 앞에 서 주세요', z.cx, c.H / 2, c.u * 5); continue; }
      if (!b) continue;
      const firing = b.t > b.warn, a = firing ? 0.75 : 0.18 + 0.25 * (b.t / b.warn), col = b.type === 'duck' ? '255,93,115' : '63,182,255';
      const duckY = base.nose + base.torso * 0.45, jumpY = base.foot - base.torso * 0.25;
      g.fillStyle = `rgba(${col},${a})`;
      if (b.type === 'duck') g.fillRect(z.x, c.H * 0.14, z.w, duckY - c.H * 0.14); else g.fillRect(z.x, jumpY, z.w, c.H - jumpY);
      g.fillStyle = `rgb(${col})`; g.fillRect(z.x, (b.type === 'duck' ? duckY : jumpY) - c.u * 0.6, z.w, c.u * 1.2);
      if (!firing) { // 발사까지 줄어드는 막대
        g.fillStyle = '#fff'; const w = z.w * 0.5 * (1 - b.t / b.warn); g.fillRect(z.cx - w / 2, c.H * 0.27, w, c.u * 1.2);
        c.text(b.type === 'duck' ? '⬇ 앉아!' : '⬆ 점프!', z.cx, c.H * 0.21, c.u * 8, '#fff');
      }
    }
  },
};
