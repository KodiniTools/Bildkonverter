/**
 * Zuschnitt-Presets für Social Media (Stand der Plattform-Empfehlungen 2026).
 *
 * Jedes Preset fixiert das Seitenverhältnis der Crop-Box (Breite / Höhe der
 * Zielgröße). Nach dem Bestätigen verkleinert der Editor das Ergebnis auf die
 * Zielgröße, falls der Ausschnitt größer ist; vergrößert wird nie.
 */

export const SOCIAL_PLATFORMS = [
  'instagram',
  'tiktok',
  'facebook',
  'x',
  'youtube',
  'linkedin',
  'pinterest',
  'threads',
  'snapchat',
  'whatsapp',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Markennamen (in allen Sprachen gleich) */
export const SOCIAL_PLATFORM_LABELS: Readonly<Record<SocialPlatform, string>> = Object.freeze({
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  threads: 'Threads',
  snapchat: 'Snapchat',
  whatsapp: 'WhatsApp',
});

/** Übersetzungsschlüssel unter transform.crop.social.formats */
export type SocialFormat =
  | 'postSquare'
  | 'postPortrait'
  | 'postGrid'
  | 'postLandscape'
  | 'post'
  | 'story'
  | 'reel'
  | 'video'
  | 'shorts'
  | 'thumbnail'
  | 'profile'
  | 'cover'
  | 'eventCover'
  | 'header'
  | 'banner'
  | 'companyCover'
  | 'pin'
  | 'status';

export interface SocialCropPreset {
  /** Eindeutige ID, Präfix "social:" grenzt sie von den Seitenverhältnissen ab */
  id: `social:${SocialPlatform}-${SocialFormat}`;
  platform: SocialPlatform;
  format: SocialFormat;
  /** Zielgröße in Pixeln */
  width: number;
  height: number;
  /** Breite / Höhe */
  ratio: number;
}

type PresetDef = [SocialFormat, number, number];

const DEFINITIONS: Record<SocialPlatform, PresetDef[]> = {
  instagram: [
    ['postSquare', 1080, 1080],
    ['postPortrait', 1080, 1350],
    ['postGrid', 1080, 1440],
    ['postLandscape', 1080, 566],
    ['story', 1080, 1920],
    ['reel', 1080, 1920],
    ['profile', 320, 320],
  ],
  tiktok: [
    ['video', 1080, 1920],
    ['story', 1080, 1920],
    ['profile', 200, 200],
  ],
  facebook: [
    ['post', 1200, 630],
    ['postSquare', 1080, 1080],
    ['postPortrait', 1080, 1350],
    ['story', 1080, 1920],
    ['cover', 851, 315],
    ['eventCover', 1920, 1005],
    ['profile', 320, 320],
  ],
  x: [
    ['post', 1600, 900],
    ['postSquare', 1080, 1080],
    ['header', 1500, 500],
    ['profile', 400, 400],
  ],
  youtube: [
    ['thumbnail', 1280, 720],
    ['shorts', 1080, 1920],
    ['banner', 2560, 1440],
    ['profile', 800, 800],
  ],
  linkedin: [
    ['post', 1200, 627],
    ['postSquare', 1080, 1080],
    ['postPortrait', 1080, 1350],
    ['cover', 1584, 396],
    ['companyCover', 1128, 191],
    ['profile', 400, 400],
  ],
  pinterest: [
    ['pin', 1000, 1500],
    ['postSquare', 1000, 1000],
    ['story', 1080, 1920],
    ['profile', 280, 280],
  ],
  threads: [
    ['postPortrait', 1080, 1350],
    ['postSquare', 1080, 1080],
    ['profile', 320, 320],
  ],
  snapchat: [
    ['story', 1080, 1920],
    ['profile', 320, 320],
  ],
  whatsapp: [
    ['status', 1080, 1920],
    ['profile', 500, 500],
  ],
};

export const SOCIAL_CROP_PRESETS: readonly SocialCropPreset[] = Object.freeze(
  SOCIAL_PLATFORMS.flatMap((platform) =>
    DEFINITIONS[platform].map(([format, width, height]) => ({
      id: `social:${platform}-${format}` as const,
      platform,
      format,
      width,
      height,
      ratio: width / height,
    }))
  )
);

/** Presets einer Plattform in der definierten Reihenfolge */
export function getSocialPresetsFor(platform: SocialPlatform): SocialCropPreset[] {
  return SOCIAL_CROP_PRESETS.filter((p) => p.platform === platform);
}

/** Findet ein Social-Preset anhand der ID; undefined für alle anderen IDs */
export function findSocialCropPreset(id: string): SocialCropPreset | undefined {
  return SOCIAL_CROP_PRESETS.find((p) => p.id === id);
}

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === 'string' && (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

/**
 * Zielgröße nach dem Zuschnitt: Ist der Ausschnitt größer als das Preset, wird
 * auf die Zielgröße verkleinert. Ist er kleiner (oder gleich), bleibt er
 * unverändert (null), damit nichts unscharf hochskaliert wird. 1 px Toleranz
 * fängt Rundungen der Crop-Box ab (z. B. 1080 × 1349 → 1080 × 1350).
 */
export function getSocialDownscaleTarget(
  preset: Pick<SocialCropPreset, 'width' | 'height'>,
  cropWidth: number,
  cropHeight: number
): { width: number; height: number } | null {
  if (!(cropWidth > 0) || !(cropHeight > 0)) return null;
  if (cropWidth === preset.width && cropHeight === preset.height) return null;
  if (cropWidth < preset.width - 1 || cropHeight < preset.height - 1) return null;
  return { width: preset.width, height: preset.height };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Seitenverhältnis als Text: gekürzt (z. B. "4:5"), sonst gerundet auf
 * x:1 bzw. 1:x (z. B. "1,91:1"), wenn die gekürzten Zahlen unhandlich sind.
 */
export function formatAspectRatio(width: number, height: number, locale = 'de'): string {
  const w = Math.round(width);
  const h = Math.round(height);
  if (w <= 0 || h <= 0) return '';
  const d = gcd(w, h);
  const rw = w / d;
  const rh = h / d;
  if (rw <= 32 && rh <= 32) return `${rw}:${rh}`;
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100);
  return w >= h ? `${fmt(w / h)}:1` : `1:${fmt(h / w)}`;
}
