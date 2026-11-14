// 그림 슬롯. assets/<key>.png 가 있으면 그 그림을, 없으면 이모지를 그린다.
// 제미나이 그림은 배경이 투명하지 않으므로, 네 귀퉁이가 같은 단색이면 그 색을 자동으로 투명 처리한다.
// 새 그림을 쓰려면: KEYS 에 이름 추가 → assets/이름.png 저장 → ctx.sprite('이름', '🙂', x, y, size)

export const KEYS = ['target', 'bomb', 'star', 'rock', 'runner_p1', 'runner_p2', 'icon_punch', 'icon_squat', 'icon_run', 'icon_catch', 'flag'];
const images = {};

export function loadAssets() {
  for (const key of KEYS) {
    const img = new Image();
    img.onload = () => { images[key] = chromaKey(img); };
    img.onerror = () => {}; // 없으면 이모지로 대체
    img.src = `assets/${key}.png`;
  }
}

function chromaKey(img) {
  try {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height;
    const px = (X, Y) => { const i = (Y * w + X) * 4; return [a[i], a[i + 1], a[i + 2], a[i + 3]]; };
    const cs = [px(2, 2), px(w - 3, 2), px(2, h - 3), px(w - 3, h - 3)], k = cs[0];
    const near = (p, tol) => Math.abs(p[0] - k[0]) + Math.abs(p[1] - k[1]) + Math.abs(p[2] - k[2]) < tol;
    if (k[3] < 250 || !cs.every(p => p[3] > 250 && near(p, 40))) return img; // 이미 투명하거나 배경이 단색이 아님
    for (let i = 0; i < a.length; i += 4) {
      const dd = Math.abs(a[i] - k[0]) + Math.abs(a[i + 1] - k[1]) + Math.abs(a[i + 2] - k[2]);
      if (dd < 90) a[i + 3] = 0; else if (dd < 150) a[i + 3] = (dd - 90) / 60 * 255;
    }
    x.putImageData(d, 0, 0);
    return c;
  } catch (e) { return img; }
}

export function sprite(g, key, emoji, x, y, size) {
  const im = images[key];
  if (im) { g.drawImage(im, x - size / 2, y - size / 2, size, size); return; }
  g.save(); g.font = `${size * 0.86}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff'; g.fillText(emoji, x, y + size * 0.05); g.restore();
}
