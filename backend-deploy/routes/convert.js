import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB
});

// Laufzeit-Check, welche Formate sharp AUSGEBEN kann
function getSupportedOutputs() {
  const f = sharp.format;
  const CANDIDATES = [
    {
      canonical: 'tiff',
      aliases: ['tiff', 'tif'],
      mime: 'image/tiff',
      available: !!f.tiff?.output,
      encoder: (p) => p.tiff({ compression: 'lzw' }),
    },
    {
      canonical: 'png',
      aliases: ['png'],
      mime: 'image/png',
      available: !!f.png?.output,
      encoder: (p) => p.png(),
    },
    {
      canonical: 'jpeg',
      aliases: ['jpeg', 'jpg'],
      mime: 'image/jpeg',
      available: !!f.jpeg?.output,
      encoder: (p) => p.jpeg({ quality: 90 }),
    },
    {
      canonical: 'webp',
      aliases: ['webp'],
      mime: 'image/webp',
      available: !!f.webp?.output,
      encoder: (p) => p.webp({ quality: 90 }),
    },
    {
      canonical: 'avif',
      aliases: ['avif'],
      mime: 'image/avif',
      available: !!f.avif?.output,
      encoder: (p) => p.avif({ quality: 50 }),
    },
    {
      canonical: 'heif',
      aliases: ['heif', 'heic'],
      mime: 'image/heif',
      available: !!f.heif?.output,
      encoder: (p) => p.heif({ compression: 'av1', quality: 90 }),
    },
    {
      canonical: 'gif',
      aliases: ['gif'],
      mime: 'image/gif',
      available: !!f.gif?.output,
      encoder: (p) => p.gif(),
    }, // Einzelbild
  ];
  const supported = CANDIDATES.filter((c) => c.available);
  const aliasMap = new Map();
  for (const c of supported) for (const a of c.aliases) aliasMap.set(a, c.canonical);
  const canonicalMap = new Map(supported.map((c) => [c.canonical, c]));
  return { supported, aliasMap, canonicalMap };
}

const OUTPUTS = getSupportedOutputs();

// ---------------------------------------------------------------------------
// SVG-Konvertierung via potrace (Bitmap-Tracing)
// Pipeline: Input → Sharp (Graustufen) → ImageMagick (PBM) → potrace → SVG
// ---------------------------------------------------------------------------

/**
 * Führt einen Shell-Befehl aus und gibt stdout/stderr zurück
 */
function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 30000, ...options }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${cmd} fehlgeschlagen: ${error.message}${stderr ? ' – ' + stderr : ''}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Konvertiert ein Rasterbild zu SVG mittels potrace
 * @param {Buffer} inputBuffer - Das Eingabebild als Buffer
 * @returns {Promise<Buffer>} - SVG als Buffer
 */
async function convertToSVG(inputBuffer) {
  const id = randomUUID();
  const tmp = tmpdir();
  const inputPath = path.join(tmp, `potrace-${id}.png`);
  const pbmPath = path.join(tmp, `potrace-${id}.pbm`);
  const svgPath = path.join(tmp, `potrace-${id}.svg`);

  try {
    // Originalgröße ermitteln für SVG-Dimensionen
    const metadata = await sharp(inputBuffer).metadata();

    // Eingabebild als PNG speichern (normalisiert durch sharp)
    const pngBuffer = await sharp(inputBuffer).png().toBuffer();
    await writeFile(inputPath, pngBuffer);

    // PNG → PBM mit ImageMagick (Graustufen + Schwellenwert)
    await runCommand('convert', [
      inputPath,
      '-colorspace',
      'Gray',
      '-normalize',
      '-threshold',
      '50%',
      pbmPath,
    ]);

    // PBM → SVG mit potrace
    await runCommand('potrace', [
      '--svg', // SVG-Ausgabe
      '--flat', // Keine Gruppierung (sauberer SVG)
      '-t',
      '4', // Rauschunterdrückung (turd size)
      '-a',
      '1.334', // Ecken-Schwellenwert (corner threshold)
      '-O',
      '0.2', // Optimierungstoleranz
      '-W',
      `${metadata.width}pt`, // Originalbreite beibehalten
      '-H',
      `${metadata.height}pt`, // Originalhöhe beibehalten
      '-o',
      svgPath,
      pbmPath,
    ]);

    // SVG lesen und zurückgeben
    return await readFile(svgPath);
  } finally {
    // Temp-Dateien aufräumen (Fehler ignorieren)
    await Promise.allSettled([unlink(inputPath), unlink(pbmPath), unlink(svgPath)]);
  }
}

/**
 * Prüft ob potrace verfügbar ist
 */
async function checkPotraceAvailable() {
  try {
    await runCommand('potrace', ['--version']);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// RAW-Kamera-Format-Unterstützung via dcraw
// Unterstützte Formate: CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2, PEF, X3F
// Pipeline: RAW-Datei → dcraw (→ TIFF/PPM stdout) → sharp (→ Zielformat)
// Voraussetzung: apt install dcraw
// ---------------------------------------------------------------------------

const RAW_EXTENSIONS = new Set([
  'cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'orf', 'rw2', 'pef', 'x3f',
]);

/**
 * Erkennt ob eine Datei ein RAW-Kameraformat ist (anhand der Dateiendung)
 */
function isRawFile(originalname) {
  const ext = path.extname(originalname || '').slice(1).toLowerCase();
  return RAW_EXTENSIONS.has(ext);
}

/**
 * Konvertiert eine RAW-Kameradatei zu einem Buffer via dcraw
 * dcraw -c   = Ausgabe auf stdout
 * dcraw -w   = Kamera-Weißabgleich verwenden
 * dcraw -T   = TIFF statt PPM ausgeben (16-bit wenn möglich)
 * dcraw -q 3 = Beste Demosaicing-Qualität (AHD)
 */
async function convertRawToBuffer(rawBuffer, originalname) {
  const id = randomUUID();
  const ext = path.extname(originalname || '.raw').toLowerCase();
  const inputPath = path.join(tmpdir(), `raw-${id}${ext}`);

  try {
    await writeFile(inputPath, rawBuffer);

    const { stdout } = await runCommand(
      'dcraw',
      ['-c', '-w', '-T', '-q', '3', inputPath],
      { encoding: 'buffer', maxBuffer: 300 * 1024 * 1024 }
    );

    return Buffer.from(stdout);
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}

/**
 * Prüft ob dcraw verfügbar ist
 */
async function checkDcrawAvailable() {
  try {
    await runCommand('dcraw', ['-v']);
    return true;
  } catch {
    return false;
  }
}

// Verfügbarkeit beim Start prüfen
let potraceAvailable = false;
let dcrawAvailable = false;

checkPotraceAvailable().then((available) => {
  potraceAvailable = available;
  console.log(
    available
      ? '✅ potrace gefunden – SVG-Vektorisierung aktiviert'
      : '⚠️ potrace nicht gefunden – SVG-Konvertierung nicht verfügbar (apt install potrace)'
  );
});

checkDcrawAvailable().then((available) => {
  dcrawAvailable = available;
  console.log(
    available
      ? '✅ dcraw gefunden – RAW-Kameraformate (CR2, NEF, ARW, DNG …) aktiviert'
      : '⚠️ dcraw nicht gefunden – RAW-Konvertierung nicht verfügbar (apt install dcraw)'
  );
});

// ---------------------------------------------------------------------------
// API-Routen
// ---------------------------------------------------------------------------

// GET /api/formats  (Frontend-Gesundheitscheck + Format-Info)
router.get('/formats', (_req, res) => {
  res.json({
    status: 'ok',
    inputs: {
      browser: ['jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'],
      backend: [
        'tiff',
        'heic',
        'heif',
        ...(dcrawAvailable ? ['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'orf', 'rw2', 'pef', 'x3f'] : []),
      ],
    },
    features: {
      svg: potraceAvailable,
      raw: dcrawAvailable,
    },
  });
});

// GET /api/convert-image/formats
router.get('/convert-image/formats', (_req, res) => {
  const formats = OUTPUTS.supported.map((c) => ({
    format: c.canonical,
    mime: c.mime,
    aliases: c.aliases,
  }));

  if (potraceAvailable) {
    formats.push({ format: 'svg', mime: 'image/svg+xml', aliases: ['svg'] });
  }

  res.json({ outputs: formats });
});

// POST /api/convert-image  (FormData: image=<Datei>, format|to=<ziel>)
router.post('/convert-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded. Expected field 'image'." });

    const requestedRaw = String(req.body.format || req.body.to || 'tiff').toLowerCase();
    const base = path.parse(req.file.originalname || 'image').name;

    // SVG-Sonderbehandlung: potrace-basierte Vektorisierung
    if (requestedRaw === 'svg') {
      if (!potraceAvailable) {
        return res.status(501).json({
          error: 'SVG-Konvertierung nicht verfügbar. potrace ist nicht installiert.',
        });
      }

      try {
        const svgBuffer = await convertToSVG(req.file.buffer);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="${base}.svg"`);
        return res.send(svgBuffer);
      } catch (e) {
        console.error('SVG-Konvertierung fehlgeschlagen:', e);
        return res.status(500).json({ error: 'SVG-Konvertierung fehlgeschlagen: ' + e.message });
      }
    }

    // RAW-Kameraformate via dcraw dekodieren
    let inputBuffer = req.file.buffer;
    if (isRawFile(req.file.originalname)) {
      if (!dcrawAvailable) {
        return res.status(501).json({
          error: 'RAW-Konvertierung nicht verfügbar. dcraw ist nicht installiert. (apt install dcraw)',
        });
      }
      try {
        inputBuffer = await convertRawToBuffer(req.file.buffer, req.file.originalname);
      } catch (e) {
        console.error('RAW-Dekodierung fehlgeschlagen:', e);
        return res.status(500).json({ error: 'RAW-Dekodierung fehlgeschlagen: ' + e.message });
      }
    }

    // Standard-Konvertierung über sharp
    const canonical = OUTPUTS.aliasMap.get(requestedRaw);
    if (!canonical) {
      const available = OUTPUTS.supported.map((c) => c.canonical).join(', ');
      const extra = potraceAvailable ? ', svg' : '';
      return res.status(400).json({
        error: `Unsupported target format '${requestedRaw}'. Available: ${available}${extra}`,
      });
    }

    const cfg = OUTPUTS.canonicalMap.get(canonical);
    const outBuf = await cfg.encoder(sharp(inputBuffer)).toBuffer();
    res.setHeader('Content-Type', cfg.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${base}.${cfg.canonical}"`);
    res.send(outBuf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

export default router;
