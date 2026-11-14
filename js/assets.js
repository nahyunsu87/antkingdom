// 그림: assets/<key>.png 가 있으면 그 그림을, 없으면 이모지를 그린다.
// 키는 처음 그려질 때 알아서 불러오므로 목록을 따로 관리하지 않는다. 쓰는 키 목록은 assets/README.md.
// 제미나이 그림은 배경이 투명하지 않으므로, 네 귀퉁이가 같은 단색이면 그 색을 자동으로 투명 처리한다.

const images = {}, tried = new Set();
function load(key) {
  tried.add(key);
  const img = new Image();
  img.onload = () => { images[key] = chromaKey(img); };
  img.onerror = () => {}; // 없으면 이모지로 대체
  img.src = `assets/${key}.png`;
}
export function preload(keys) { for (const k of keys) if (!tried.has(k)) load(k); }
export const hasImage = key => !!images[key];

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
  if (!tried.has(key)) load(key);
  const im = images[key];
  if (im) { g.drawImage(im, x - size / 2, y - size / 2, size, size); return; }
  g.save(); g.font = `${size * 0.86}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff'; g.fillText(emoji, x, y + size * 0.05); g.restore();
}
