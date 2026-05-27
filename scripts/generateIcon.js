/**
 * Generate a valid ICO file (256x256 PNG-in-ICO, 32-bit RGBA)
 * Creates a retro arcade icon for GameZDD
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─── PNG builder ─────────────────────────────────────────────────────────────
function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(w, h, pixelsFn) {
  const rawRows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(w * 4 + 1);
    row[0] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixelsFn(x, y, w, h);
      row[1 + x * 4 + 0] = r;
      row[1 + x * 4 + 1] = g;
      row[1 + x * 4 + 2] = b;
      row[1 + x * 4 + 3] = a;
    }
    rawRows.push(row);
  }
  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0); ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; ihdrData[9] = 6;
  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function lerpColor(a, b, t) {
  return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t), Math.round(a[3]+(b[3]-a[3])*t)];
}

function drawIcon(x, y, W, H) {
  const cx = W/2, cy = H/2, dx = x-cx, dy = y-cy;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const r = W*0.48;
  if (dist > r) return [0,0,0,0];
  if (dist > r-8) { const t=(dist-(r-8))/8; return lerpColor([0,220,255,255],[10,5,25,255],t); }
  const bg = lerpColor([10,5,25,255],[30,10,60,255], y/H);
  if ((x%32<1.5 || y%32<1.5) && dist < r-9) return lerpColor([50,0,100,180],bg,0.5);

  // "G" glyph: 10 cols x 8 rows mapped to center
  const gscale = W*0.28;
  const gc = Math.round(dx/gscale * 5 + 4.5);
  const gr = Math.round(dy/gscale * 4 + 3.5);
  const G = ['  XXXXXX  ','  X      X',' X        ',' X        ',' X   XXXXX',' X      XX','  X      X','  XXXXXX  '];
  if (gr>=0&&gr<G.length&&gc>=0&&gc<G[0].length&&G[gr][gc]==='X') return [0,220,255,255];

  const stars = [[0.25,0.25],[-0.3,0.2],[0.3,-0.3],[-0.25,-0.28],[0.1,0.38],[-0.38,-0.1],[0.0,-0.38],[0.38,0.12]];
  for(const[sx,sy]of stars){const sd=Math.sqrt(((dx/cx)-sx)**2+((dy/cy)-sy)**2)*(W/2);if(sd<4){return lerpColor([0,220,255,255],bg,sd/4);}}
  return bg;
}

function makeIcoFromPng(pngBuf, size) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0,0); icoHeader.writeUInt16LE(1,2); icoHeader.writeUInt16LE(1,4);
  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = size===256?0:size; dirEntry[1] = size===256?0:size;
  dirEntry.writeUInt16LE(1,4); dirEntry.writeUInt16LE(32,6);
  dirEntry.writeUInt32LE(pngBuf.length,8); dirEntry.writeUInt32LE(22,12);
  return Buffer.concat([icoHeader, dirEntry, pngBuf]);
}

const SIZE = 256;
const png = makePng(SIZE, SIZE, drawIcon);
const ico = makeIcoFromPng(png, SIZE);
const outPath = path.join(__dirname,'..','assets','icon.ico');
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath, ico);
console.log('Created icon.ico: '+ico.length+' bytes');


function makeIco(width, height, pixelsFn) {
  // Create pixel buffer (BGRA bottom-up for ICO BMP format)
  const pixels = Buffer.alloc(width * height * 4, 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const col = pixelsFn(x, y, width, height);
      // ICO stores bottom-up
      const idx = ((height - 1 - y) * width + x) * 4;
      pixels[idx + 0] = col[2]; // B
      pixels[idx + 1] = col[1]; // G
      pixels[idx + 2] = col[0]; // R
      pixels[idx + 3] = col[3]; // A
    }
  }

  // BITMAPINFOHEADER (40 bytes)
  const dibHeader = Buffer.alloc(40, 0);
  dibHeader.writeUInt32LE(40, 0);      // biSize
  dibHeader.writeInt32LE(width, 4);    // biWidth
  dibHeader.writeInt32LE(height * 2, 8); // biHeight (x2 for AND mask)
  dibHeader.writeUInt16LE(1, 12);      // biPlanes
  dibHeader.writeUInt16LE(32, 14);     // biBitCount
  dibHeader.writeUInt32LE(0, 16);      // biCompression
  dibHeader.writeUInt32LE(pixels.length, 20); // biSizeImage
  dibHeader.writeInt32LE(0, 24);       // biXPelsPerMeter
  dibHeader.writeInt32LE(0, 28);       // biYPelsPerMeter
  dibHeader.writeUInt32LE(0, 32);      // biClrUsed
  dibHeader.writeUInt32LE(0, 36);      // biClrImportant

  // AND mask (all zeros = fully opaque), padded to 4-byte rows
  const rowBytes = Math.ceil(width / 8);
  const paddedRow = Math.ceil(rowBytes / 4) * 4;
  const andMask = Buffer.alloc(paddedRow * height, 0);

  const imageData = Buffer.concat([dibHeader, pixels, andMask]);

  // ICO header (6 bytes)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);    // reserved
  icoHeader.writeUInt16LE(1, 2);    // type: ICO
  icoHeader.writeUInt16LE(1, 4);    // count: 1

  // Directory entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = width === 256 ? 0 : width;   // width (0 = 256)
  dirEntry[1] = height === 256 ? 0 : height; // height
  dirEntry[2] = 0;   // color count (0 for 32-bit)
  dirEntry[3] = 0;   // reserved
  dirEntry.writeUInt16LE(1, 4);    // planes
  dirEntry.writeUInt16LE(32, 6);   // bit count
  dirEntry.writeUInt32LE(imageData.length, 8); // size of image data
  dirEntry.writeUInt32LE(6 + 16, 12); // offset to image data

  return Buffer.concat([icoHeader, dirEntry, imageData]);
}

// Color palette
const BG    = [15, 10, 30, 255];      // dark navy
const ACC1  = [100, 0, 220, 255];     // neon purple
const ACC2  = [0, 220, 255, 255];     // neon cyan
const WHITE = [255, 255, 255, 255];
const TRANS = [0, 0, 0, 0];

function drawGameZDDIcon(x, y, w, h) {
  const cx = w / 2, cy = h / 2;

  // Background circle
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = w * 0.47;

  if (dist > r) return TRANS; // outside circle = transparent

  // Outer ring
  if (dist > r - 2.5) return ACC2;

  // Inner background
  const bg = BG;

  // Draw a simple "G" letter in the center using pixel art
  const lx = x - cx + 5;
  const ly = y - cy + 4;

  // Letter G pixel pattern (14x16 region centered)
  const GX = Math.round(x - cx + 2);
  const GY = Math.round(y - cy + 3);

  // Simple "G" shape
  if (GX >= 0 && GX <= 11 && GY >= 0 && GY <= 12) {
    const gMap = [
      '  XXXXXX  ',
      ' X      X ',
      'X         ',
      'X         ',
      'X   XXXXX ',
      'X       X ',
      ' X      X ',
      '  XXXXXX  ',
    ];
    const row = gMap[GY < 8 ? GY : -1];
    if (row && GX < row.length && row[GX] === 'X') return ACC2;
  }

  // Small star dots (decorative pixels)
  const stars = [[4,4],[10,10],[6,14],[14,6],[12,12],[5,11]];
  for (const [sx, sy] of stars) {
    if (Math.abs(x - sx) < 1.2 && Math.abs(y - sy) < 1.2) return ACC2;
  }

  // Joystick base (bottom circle)
  const jx = x - cx * 0.1, jy = y - cy - 2;
  const jdist = Math.sqrt(jx*jx + jy*jy);
  if (jdist < 3.5) return WHITE;
  if (jdist < 5) return ACC1;

  // Controller outline
  const gpadW = 11, gpadH = 6;
  const gpx = x - cx, gpy = y - cy + 4;
  if (Math.abs(gpx) < gpadW && Math.abs(gpy) < gpadH) {
    if (Math.abs(gpx) > gpadW - 1.5 || Math.abs(gpy) > gpadH - 1.5) return ACC1;
    // D-pad cross
    if ((Math.abs(gpx) < 2 && Math.abs(gpy - 1) < 3) ||
        (Math.abs(gpx - 0) < 3 && Math.abs(gpy - 1) < 1.5)) return WHITE;
    // Action buttons
    if (Math.sqrt((gpx-5)**2 + (gpy-1)**2) < 1.4) return ACC2;
    if (Math.sqrt((gpx-7)**2 + (gpy-1)**2) < 1.4) return [255, 80, 80, 255];
  }

  return bg;
}

// Generate 32x32 ICO
const ico32 = makeIco(32, 32, drawGameZDDIcon);

// Save
const outPath = path.join(__dirname, '..', 'assets', 'icon.ico');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, ico32);
console.log('Created icon.ico: ' + ico32.length + ' bytes at ' + outPath);
