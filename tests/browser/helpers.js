/**
 * Gemeinsame Helfer für Browser-Tests (echter 2D-Canvas in Chromium).
 */

/** Deterministisches Testbild als HTMLImageElement */
export function makeImage(width, height, variant = 0) {
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, variant ? '#ff8800' : '#2266cc');
    g.addColorStop(1, variant ? '#004488' : '#ffee22');
    x.fillStyle = g;
    x.fillRect(0, 0, width, height);
    x.fillStyle = 'rgba(255,255,255,0.7)';
    x.beginPath();
    x.arc(width * 0.3, height * 0.6, Math.min(width, height) * 0.2, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#222';
    x.fillRect(width * 0.6, height * 0.2, width * 0.25, height * 0.3);
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = c.toDataURL();
  });
}

/** Einfarbige Bilddatei (PNG) als File-Objekt */
export async function makePngFile(name, width, height, color = '#3366cc') {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const x = c.getContext('2d');
  x.fillStyle = color;
  x.fillRect(0, 0, width, height);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  return new File([blob], name, { type: 'image/png' });
}

export function pixelAt(canvas, x, y) {
  return [...canvas.getContext('2d').getImageData(x, y, 1, 1).data];
}

/** Anzahl abweichender Pixel zwischen zwei gleich großen Canvases */
export function diffPixels(a, b) {
  const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data;
  const db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
  let n = 0;
  for (let i = 0; i < da.length; i += 4) {
    if (
      da[i] !== db[i] ||
      da[i + 1] !== db[i + 1] ||
      da[i + 2] !== db[i + 2] ||
      da[i + 3] !== db[i + 3]
    )
      n++;
  }
  return n;
}

export function snapshot(canvas) {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  c.getContext('2d').drawImage(canvas, 0, 0);
  return c;
}

/** Toast-Attrappe, sammelt Aufrufe */
export function installToastMock() {
  const calls = [];
  window.$toast = Object.fromEntries(
    ['success', 'info', 'warning', 'error'].map((level) => [
      level,
      (msg) => calls.push(`${level}:${msg}`),
    ])
  );
  return calls;
}

/** i18n-Attrappe: Schlüssel plus Parameter; ein String als zweites Argument ist der Fallback-Text und wird ignoriert */
export const t = (key, params) =>
  key + (params && typeof params === 'object' ? JSON.stringify(params) : '');
