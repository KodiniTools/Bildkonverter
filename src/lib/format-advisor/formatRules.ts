export type Use = 'website' | 'shop' | 'logo' | 'social' | 'email' | 'print' | 'archive';
export type ImageInfo = {
  width: number;
  height: number;
  hasTransparency: boolean;
  isPhoto: boolean;
};
export type FormatAdvice = {
  format: string;
  summary: string;
  settings: { name: string; value: string }[];
  reasons: string[];
  alternative: string;
  /** Punkte, die der Editor nicht einstellt und die mit der Druckerei zu klären sind */
  printShop?: string[];
};

export const USES: { id: Use; label: string }[] = [
  { id: 'website', label: 'Website / blog image' },
  { id: 'shop', label: 'Product photo for an online shop' },
  { id: 'logo', label: 'Logo, icon or graphic' },
  { id: 'social', label: 'Social media post' },
  { id: 'email', label: 'Send by email / messenger' },
  { id: 'print', label: 'Print (poster, flyer, photo)' },
  { id: 'archive', label: 'Archive the original' },
];

const maxW = (w: number, cap: number) => `${Math.min(w, cap)} px wide (don't upscale)`;

export function recommendFormat(use: Use, img: ImageInfo): FormatAdvice {
  const t = img.hasTransparency;
  const kind = img.isPhoto ? 'photo' : 'graphic';
  switch (use) {
    case 'website':
      return {
        format: 'WebP',
        summary: `WebP gives the smallest file for a ${kind} on a website and is supported by all modern browsers.`,
        settings: [
          { name: 'Quality', value: img.isPhoto ? '80 %' : '100 %' },
          { name: 'Size', value: maxW(img.width, 1920) },
          { name: 'Transparency', value: t ? 'Keep (WebP supports it)' : 'Not needed' },
          { name: 'Metadata', value: 'Remove' },
        ],
        reasons: [
          'Typically 25–35 % smaller than JPG at the same quality',
          'Faster pages help your Google ranking',
        ],
        alternative: t
          ? "PNG if an old system can't handle WebP."
          : "JPG at 80 % if an old system can't handle WebP.",
      };
    case 'shop':
      return {
        format: t ? 'PNG' : 'WebP',
        summary: t
          ? 'Your image is transparent, so PNG keeps clean edges on any shop background.'
          : 'WebP keeps product photos sharp while loading quickly.',
        settings: [
          { name: 'Quality', value: t ? 'Lossless' : '85 %' },
          { name: 'Size', value: maxW(img.width, 2000) + ', square crop if your shop uses one' },
          { name: 'Colour profile', value: 'sRGB (the editor exports in sRGB)' },
          { name: 'Metadata', value: 'Remove' },
        ],
        reasons: [
          '2000 px allows zoom without huge files',
          'sRGB shows colours the same on every screen',
        ],
        alternative: "JPG at 85 % if your shop system doesn't accept WebP.",
      };
    case 'logo':
      return {
        format: 'PNG',
        summary: 'PNG keeps sharp edges, text and transparency without blur or artefacts.',
        settings: [
          { name: 'Compression', value: 'Lossless' },
          { name: 'Size', value: maxW(img.width, 1024) },
          { name: 'Transparency', value: t ? 'Keep' : 'Consider removing the background' },
        ],
        reasons: ["JPG blurs edges and can't be transparent", 'Lossless keeps flat colours clean'],
        alternative: 'SVG if you have the logo as a vector file — it stays sharp at any size.',
      };
    case 'social':
      return {
        format: 'JPG',
        summary: 'Social networks recompress every upload; a high-quality JPG survives this best.',
        settings: [
          { name: 'Quality', value: '90 %' },
          {
            name: 'Size',
            value: '1080 × 1080 px (square) or 1080 × 1350 px (portrait), crop in the editor',
          },
          { name: 'Colour profile', value: 'sRGB (the editor exports in sRGB)' },
          { name: 'Transparency', value: t ? 'Fill with a background colour' : 'Not needed' },
        ],
        reasons: [
          'Uploading the exact target size avoids extra scaling',
          "Platforms don't keep transparency",
        ],
        alternative: 'PNG for screenshots or graphics with lots of text.',
      };
    case 'email':
      return {
        format: t ? 'PNG' : 'JPG',
        summary: 'Opens on every device and stays small enough for email and messengers.',
        settings: [
          { name: 'Quality', value: t ? 'Lossless' : '80 %' },
          { name: 'Size', value: maxW(img.width, 1600) },
          { name: 'Metadata', value: 'Remove (also removes location data)' },
        ],
        reasons: ['Every phone and mail program can show JPG/PNG', '1600 px is plenty for screens'],
        alternative: 'PDF if you send several images as one document.',
      };
    case 'print': {
      const cm = (px: number) => ((px / 300) * 2.54).toFixed(1);
      return {
        format: 'TIFF',
        summary: 'TIFF keeps full quality for print shops without compression loss.',
        settings: [
          { name: 'Size', value: 'Original size (do not shrink)' },
          { name: 'Resolution', value: '300 DPI (written into the file)' },
          { name: 'Max. print size', value: `${cm(img.width)} × ${cm(img.height)} cm at 300 DPI` },
          { name: 'Compression', value: 'LZW (lossless)' },
        ],
        reasons: [
          'Lossless format accepted by print shops',
          'Every pixel counts for a sharp print',
        ],
        alternative: 'JPG at 100 % if the print shop asks for JPG.',
        printShop: [
          'Colour: ask whether CMYK is required. The editor saves in RGB, many print shops convert it themselves.',
        ],
      };
    }
    case 'archive':
      return {
        format: img.isPhoto ? 'TIFF' : 'PNG',
        summary: 'Keep a lossless master copy; create smaller copies from it when needed.',
        settings: [
          { name: 'Compression', value: 'Lossless' },
          { name: 'Size', value: 'Original size' },
          {
            name: 'Metadata',
            value: img.isPhoto ? 'TIFF does not keep them, so also keep the original file' : 'Keep',
          },
        ],
        reasons: [
          'Lossy formats lose quality with every save',
          img.isPhoto
            ? 'The original file keeps date and camera info'
            : 'Metadata keeps date and camera info',
        ],
        alternative: img.isPhoto
          ? 'PNG if you need smaller lossless files.'
          : 'TIFF for print workflows.',
      };
  }
}
