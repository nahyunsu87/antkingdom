// 창문 닦기 — 팔 크게 문지르기. 화면을 덮은 뿌연 김을 손으로 닦으면 그 자리에 카메라 속 내 모습이 보인다.
// 다 닦으면 칭찬하고 새 김(다른 색)이 낀다.
const CX = 32, CY = 18; // 김의 해상도(칸 수). 작게 그려서 크게 늘리면 가장자리가 부드럽다
const TINTS = [[205, 222, 240], [255, 255, 255], [255, 214, 235], [210, 240, 215]];

export default {
  id: 'wipe', title: '창문 닦기', emoji: '🧽', color: '#9fe3ff', duration: 40,

  start() {
    const cv = document.createElement('canvas'); cv.width = CX; cv.height = CY;
    return { cv, cg: cv.getContext('2d'), img: null, cells: new Float32Array(CX * CY).fill(1), newly: 0, round: 0, wait: 0 };
  },

  update(s, dt, c) {
    if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) { s.cells.fill(1); s.round++; } return; }
    const cw = c.W / CX, ch = c.H / CY;
    for (const p of c.present()) for (const h of p.hands) {
      if (h.v < 0.3) continue;
      const rr = p.sw * 0.75;
      const x0 = Math.max(0, Math.floor((h.x - rr) / cw)), x1 = Math.min(CX - 1, Math.floor((h.x + rr) / cw));
      const y0 = Math.max(0, Math.floor((h.y - rr) / ch)), y1 = Math.min(CY - 1, Math.floor((h.y + rr) / ch));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (Math.hypot((x + 0.5) * cw - h.x, (y + 0.5) * ch - h.y) > rr) continue;
        const i = y * CX + x, before = s.cells[i];
        s.cells[i] = Math.max(0, before - dt * 5);
        if (before >= 0.15 && s.cells[i] < 0.15) {
          s.newly++;
          if (s.newly % 25 === 0) c.add(1, h.x, h.y, '#9fe3ff'); else if (s.newly % 5 === 0) c.fx(h.x, h.y, '#ffffff', 3);
        }
      }
    }
    let clear = 0;
    for (const v of s.cells) if (v < 0.15) clear++;
    if (clear / s.cells.length > 0.85) {
      s.wait = 2.5; s.cells.fill(0);
      c.add(3, c.W / 2, c.H / 2, '#ffd23f'); c.fx(c.W / 2, c.H / 2, '#9fe3ff', 30, 2, 0.9);
      c.say('clean', true); c.sfx.cheer();
    }
  },

  draw(s, g, c) {
    const t = TINTS[s.round % TINTS.length];
    if (!s.img) s.img = s.cg.createImageData(CX, CY);
    const d = s.img.data;
    for (let i = 0; i < s.cells.length; i++) { d[i * 4] = t[0]; d[i * 4 + 1] = t[1]; d[i * 4 + 2] = t[2]; d[i * 4 + 3] = s.cells[i] * 235; }
    s.cg.putImageData(s.img, 0, 0);
    g.imageSmoothingEnabled = true; g.drawImage(s.cv, 0, 0, c.W, c.H);
    for (const p of c.present()) for (const h of p.hands) if (h.v > 0.3) c.sprite('sponge', '🧽', h.x, h.y, p.sw * 0.7);
  },
};
