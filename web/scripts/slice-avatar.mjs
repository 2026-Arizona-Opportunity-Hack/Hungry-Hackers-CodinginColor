/**
 * Slice the 5x2 robot-evolution poster into 10 transparent PNGs.
 *
 * Usage: node scripts/slice-avatar.mjs [source.png]
 * Output: web/public/avatar/level-1..10.png (+ source copy + slice-report.json)
 *
 * Layout (verified by probing): 5 columns x 2 rows of vertical scene cards.
 * Each card: ~290x543 px, robot upper-center, "Level N" pill at ~78%.
 *
 * Method per level:
 *  1. Drop the pill zone (keep top 76%).
 *  2. Sample background colors from an H-border GRID (not the edge columns —
 *     some cards touch the card edge; the top rows are reliably empty sky).
 *     Each sample is weighted by how many near-matches it gets across the
 *     kept zone; keep the top MODE colors and treat "near any of them" as bg.
 *     Then flood-fill from the border through near-bg pixels (only connected
 *     pixels go transparent — the robot, enclosed by its outline, survives).
 *  3. Keep the largest surviving blob (= the robot, drops sun/clouds), crop.
 *  4. Paste onto a shared 512x512 canvas: COMMON baseline + GLOBAL scale.
 */
import { copyFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, "..");
const outDir = join(webDir, "public", "avatar");
const sourceDir = join(outDir, "source");
const src = process.argv[2] ?? "/Users/yoganshchandaluri/Downloads/Coding in Color_ Robot Evolution Levels.png";

const COLS = 5;
const ROWS = 2;
const OUT = 512;
const KEEP = 0.76;
const BG_TOL = 30;
const FIT = 440;
const BASELINE = 30;

mkdirSync(sourceDir, { recursive: true });

const meta = await sharp(src).metadata();
const W = meta.width;
const H = meta.height;
if (!W || !H) throw new Error("could not read source dimensions");
const cw = W / COLS;
const ch = H / ROWS;
console.log(`source ${W}x${H}, card ${cw.toFixed(1)}x${ch.toFixed(1)}`);

copyFileSync(src, join(sourceDir, "levels.png"));

const { data: px } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => {
  x = Math.max(0, Math.min(W - 1, Math.round(x)));
  y = Math.max(0, Math.min(H - 1, Math.round(y)));
  const i = (y * W + x) * 4;
  return [px[i], px[i + 1], px[i + 2]];
};
const q = (a) => `${a[0] >> 3},${a[1] >> 3},${a[2] >> 3}`;
const uq = (s) => s.split(",").map((v) => (Number(v) << 3) + 4);
const nearQ = (c, bgQ) => {
  const b = uq(bgQ);
  return Math.abs(c[0] - b[0]) <= BG_TOL && Math.abs(c[1] - b[1]) <= BG_TOL && Math.abs(c[2] - b[2]) <= BG_TOL;
};

const crops = [];
for (let level = 1; level <= 10; level++) {
  const col = (level - 1) % COLS;
  const row = Math.floor((level - 1) / COLS);
  const x0 = Math.round(col * cw);
  const y0 = Math.round(row * ch);
  const w = Math.round((col + 1) * cw) - x0;
  const fullH = Math.round((row + 1) * ch) - y0;
  const h = Math.floor(fullH * KEEP);

  // Candidate bg colors: grid across the top band + side mid-points.
  const candCounts = new Map();
  const vote = (x, y) => {
    const k = q(at(x0 + x, y0 + y));
    candCounts.set(k, (candCounts.get(k) ?? 0) + 1);
  };
  for (let x = 6; x < w - 4; x += 7) {
    vote(x, 12);
    vote(x, 22);
  }
  for (let y = 40; y < h; y += 12) {
    vote(6, y);
    vote(w - 7, y);
  }
  // Score candidates by total near-matches in the kept zone (strided scan).
  const scored = [];
  for (const [k, v] of candCounts) {
    if (v < 2) continue;
    let m = 0;
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if (nearQ(at(x0 + x, y0 + y), k)) m++;
      }
    }
    scored.push([m, k]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  // Greedy cover: take modes until 55% of pixels are explained (max 4 modes).
  const total = (w / 4) * (h / 4);
  const isBgPixel = (x, y) => {
    const c = at(x0 + x, y0 + y);
    return bgModes.some((k) => nearQ(c, k));
  };
  const bgModes = [];
  {
    const explained = new Set();
    const key = (x, y) => y * w + x;
    for (const [, k] of scored) {
      if (bgModes.length >= 4) break;
      let add = 0;
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const kk = key(x, y);
          if (explained.has(kk)) continue;
          if (nearQ(at(x0 + x, y0 + y), k)) {
            add++;
            explained.add(kk);
          }
        }
      }
      if (add > total * 0.03) bgModes.push(k);
      if (explained.size > total * 0.55 && bgModes.length >= 1) break;
    }
    if (bgModes.length === 0 && scored.length) bgModes.push(scored[0][1]);
  }

  // Flood fill from the border through near-bg pixels.
  const isBg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (isBg[i]) return;
    if (!isBgPixel(x, y)) return;
    isBg[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Largest surviving connected blob = the robot (drops sun/clouds/mountains).
  const seen = new Uint8Array(w * h);
  let best = null;
  for (let s = 0; s < w * h; s++) {
    if (isBg[s] || seen[s]) continue;
    let n = 0, minX = w, minY = h, maxX = -1, maxY = -1, touch = false;
    const st = [s];
    seen[s] = 1;
    while (st.length) {
      const i = st.pop();
      n++;
      const x = i % w, y = (i / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touch = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const nb = (xx, yy) => {
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) return;
        const j = yy * w + xx;
        if (isBg[j] || seen[j]) return;
        seen[j] = 1;
        st.push(j);
      };
      nb(x + 1, y);
      nb(x - 1, y);
      nb(x, y + 1);
      nb(x, y - 1);
    }
    if (!best || n > best.n) best = { n, minX, minY, maxX, maxY, touch };
  }

  let bx = 0, by = 0, bw = w, bh = h;
  const minSize = 30;
  if (best && best.n > 500 && best.maxX - best.minX >= minSize && best.maxY - best.minY >= minSize) {
    // Accept the blob, but if it touches the border it may have leaked:
    // shrink-wrap it by re-scanning the tight bbox for a *core* using a
    // stricter tolerance against the dominant (first) bg mode.
    const pad = 5;
    bx = Math.max(0, best.minX - pad);
    by = Math.max(0, best.minY - pad);
    bw = Math.min(w - bx, best.maxX - bx + 1 + pad);
    bh = Math.min(h - by, best.maxY - by + 1 + pad);
    if (best.touch && bgModes.length > 0) {
      // Erode: drop pixels near the dominant bg mode from the bbox edges
      // inward until hitting robot pixels (margin walk, max 40px per side).
      const dom = bgModes[0];
      const strict = (x, y) => nearQ(at(x0 + x, y0 + y), dom);
      let l = bx, r = bx + bw - 1, t = by, b = by + bh - 1;
      const rowBg = (y) => {
        let n = 0;
        for (let x = l; x <= r; x += 2) if (!isBg[y * w + x] || strict(x, y)) n++;
        return n / Math.max(1, (r - l) / 2);
      };
      for (let k = 0; k < 40 && t < b; k++, t++) if (rowBg(t) < 0.5) break;
      for (let k = 0; k < 40 && b > t; k--, b--) if (rowBg(b) < 0.5) break;
      if (b - t >= minSize && r - l >= minSize) {
        by = t;
        bh = b - t + 1;
      }
    }
  }

  const buf = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const gx = x0 + bx + x;
      const gy = y0 + by + y;
      const gi = (gy * W + gx) * 4;
      const o = (y * bw + x) * 4;
      if (isBg[(by + y) * w + (bx + x)]) {
        buf[o + 3] = 0;
      } else {
        buf[o] = px[gi];
        buf[o + 1] = px[gi + 1];
        buf[o + 2] = px[gi + 2];
        buf[o + 3] = 255;
      }
    }
  }
  await sharp(buf, { raw: { width: bw, height: bh, channels: 4 } })
    .png()
    .toFile(join(outDir, `_crop-${level}.png`));
  crops.push({ level, bw, bh, modes: bgModes.map(uq), bboxTouch: best?.touch ?? null, blobPx: best?.n ?? 0 });
  console.log(`L${level}: crop ${bw}x${bh} blob ${best?.n ?? 0}px touch=${best?.touch} modes=${bgModes.length}`);
}

let maxDim = 0;
for (const c of crops) maxDim = Math.max(maxDim, c.bw, c.bh);
const scale = Math.min(1.5, FIT / maxDim);
console.log(`global scale ${scale.toFixed(3)}`);

const summary = [];
for (const c of crops) {
  const dw = Math.max(1, Math.round(c.bw * scale));
  const dh = Math.max(1, Math.round(c.bh * scale));
  const left = Math.round((OUT - dw) / 2);
  const top = OUT - BASELINE - dh;
  const resized = await sharp(join(outDir, `_crop-${c.level}.png`)).resize(dw, dh, { fit: "fill" }).toBuffer();
  const sx = Math.max(0, -left);
  const sy = Math.max(0, -top);
  const sw = Math.min(dw - sx, OUT - Math.max(0, left));
  const sh = Math.min(dh - sy, OUT - Math.max(0, top));
  if (sw <= 0 || sh <= 0) throw new Error(`level ${c.level} fully outside canvas`);
  const part = await sharp(resized).extract({ left: sx, top: sy, width: sw, height: sh }).toBuffer();
  await sharp({ create: { width: OUT, height: OUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } });
  await sharp({ create: { width: OUT, height: OUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: part, left: Math.max(0, left), top: Math.max(0, top) }])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, `level-${c.level}.png`));
  const { data } = await sharp(join(outDir, `level-${c.level}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 8) opaque++;
  const opaquePct = opaque / (OUT * OUT);
  summary.push({ level: c.level, file: `level-${c.level}.png`, w: OUT, h: OUT, drawnW: dw, drawnH: dh, opaquePct: +opaquePct.toFixed(3), modes: c.modes });
  console.log(`L${c.level}: drew ${dw}x${dh} at (${left},${top}), opaque ${(opaquePct * 100).toFixed(1)}%`);
  const tmp = join(outDir, `_crop-${c.level}.png`);
  if (existsSync(tmp)) unlinkSync(tmp);
}

writeFileSync(join(outDir, "slice-report.json"), JSON.stringify({ source: { width: W, height: H }, scale, levels: summary }, null, 2));
console.log("wrote slice-report.json");

const thumbs = [];
for (const s of summary) {
  thumbs.push(await sharp(join(outDir, s.file)).resize(160, 160, { fit: "contain", background: { r: 255, g: 0, b: 255, alpha: 1 } }).toBuffer());
}
await sharp({ create: { width: 160 * 5, height: 160 * 2, channels: 3, background: { r: 255, g: 0, b: 255 } } })
  .composite(thumbs.map((input, i) => ({ input, left: (i % 5) * 160, top: Math.floor(i / 5) * 160 })))
  .jpeg({ quality: 70 })
  .toFile("/tmp/avatar-sheet.jpg");
console.log("wrote /tmp/avatar-sheet.jpg");

const thin = summary.filter((s) => s.opaquePct < 0.02);
if (thin.length) {
  console.log(`WARNING: thin sprites: ${thin.map((s) => s.level).join(", ")}`);
  process.exitCode = 2;
} else {
  console.log("all 10 sprites solid (opaque >= 2%).");
}
