/**
 * Median-cut color quantization for GIF encoding.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Box {
  pixels: RGB[];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

function createBox(pixels: RGB[]): Box {
  let rMin = 255,
    rMax = 0,
    gMin = 255,
    gMax = 0,
    bMin = 255,
    bMax = 0;
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }
  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax };
}

function splitBox(box: Box): [Box, Box] {
  const rRange = box.rMax - box.rMin;
  const gRange = box.gMax - box.gMin;
  const bRange = box.bMax - box.bMin;
  const channel: keyof RGB =
    rRange >= gRange && rRange >= bRange ? "r" : gRange >= bRange ? "g" : "b";

  box.pixels.sort((a, b) => a[channel] - b[channel]);
  const mid = box.pixels.length >> 1;

  return [createBox(box.pixels.slice(0, mid)), createBox(box.pixels.slice(mid))];
}

/**
 * Build a GIF-compatible palette (up to maxColors, padded to power of 2).
 * Samples pixels from all provided ImageData frames using median-cut quantization.
 */
export function buildPalette(frames: ImageData[], maxColors: number): number[] {
  const totalPixels = frames.reduce((sum, f) => sum + f.data.length / 4, 0);
  const step = Math.max(1, Math.floor(totalPixels / 10000));
  const samples: RGB[] = [];
  let count = 0;

  for (const frame of frames) {
    const data = frame.data;
    for (let i = 0; i < data.length; i += 4) {
      if (count++ % step === 0) {
        samples.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
      }
    }
  }

  let boxes: Box[] = [createBox(samples)];
  while (boxes.length < maxColors) {
    let bestIdx = -1;
    let bestVolume = -1;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]!;
      if (b.pixels.length <= 1) continue;
      const vol = (b.rMax - b.rMin + 1) * (b.gMax - b.gMin + 1) * (b.bMax - b.bMin + 1);
      if (vol > bestVolume) {
        bestVolume = vol;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    const [a, b] = splitBox(boxes[bestIdx]!);
    boxes.splice(bestIdx, 1, a, b);
  }

  const palette = boxes.map((box) => {
    let r = 0,
      g = 0,
      b = 0;
    for (const p of box.pixels) {
      r += p.r;
      g += p.g;
      b += p.b;
    }
    const n = box.pixels.length;
    return (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(b / n);
  });

  // Pad to power of 2 (required by GIF spec)
  let size = 2;
  while (size < palette.length) size <<= 1;
  while (palette.length < size) palette.push(0x000000);

  return palette;
}

/**
 * Build a lookup table (32768 entries) mapping 15-bit color keys to palette indices.
 */
export function buildColorMap(palette: number[]): Uint8Array {
  const map = new Uint8Array(32768);
  const pr: number[] = [];
  const pg: number[] = [];
  const pb: number[] = [];
  for (const c of palette) {
    pr.push((c >> 16) & 0xff);
    pg.push((c >> 8) & 0xff);
    pb.push(c & 0xff);
  }

  for (let i = 0; i < 32768; i++) {
    const r = ((i >> 10) & 0x1f) << 3;
    const g = ((i >> 5) & 0x1f) << 3;
    const b = (i & 0x1f) << 3;
    let best = 0;
    let bestDist = Infinity;
    for (let j = 0; j < palette.length; j++) {
      const dr = r - pr[j]!;
      const dg = g - pg[j]!;
      const db = b - pb[j]!;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = j;
      }
    }
    map[i] = best;
  }

  return map;
}

/**
 * Map RGBA pixel data to palette indices using a precomputed color map.
 */
export function mapPixels(rgba: Uint8ClampedArray, colorMap: Uint8Array): number[] {
  const n = rgba.length >> 2;
  const indexed: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const off = i << 2;
    const key = ((rgba[off]! >> 3) << 10) | ((rgba[off + 1]! >> 3) << 5) | (rgba[off + 2]! >> 3);
    indexed[i] = colorMap[key]!;
  }
  return indexed;
}
