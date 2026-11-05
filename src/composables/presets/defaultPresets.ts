/** Filterwerte eines Presets (Teilmenge der Editor-Filter) */
export type PresetFilters = Record<string, number>;

export interface FilterPreset {
  id: string;
  name: string;
  /** AppIcon-Name; ältere eigene Presets tragen noch ein Emoji */
  icon?: string;
  description?: string;
  filters: PresetFilters;
  custom?: boolean;
}

// Standard-Presets mit allen Foto-Effekten (inkl. neue Filter)
export const DEFAULT_PRESETS: readonly FilterPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    icon: 'image',
    description: 'Original',
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hue: 0,
      sepia: 0,
      grayscale: 0,
      vignette: 0,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'history',
    description: 'Retro-Look',
    filters: {
      brightness: 110,
      contrast: 90,
      saturation: 70,
      blur: 0,
      hue: 0,
      sepia: 40,
      vignette: 30,
    },
  },
  {
    id: 'bw',
    name: 'Schwarz/Weiß',
    icon: 'circle-half-stroke',
    description: 'Klassisch',
    filters: { brightness: 100, contrast: 120, saturation: 0, blur: 0, hue: 0, grayscale: 100 },
  },
  {
    id: 'vivid',
    name: 'Lebendig',
    icon: 'palette',
    description: 'Kräftige Farben',
    filters: { brightness: 105, contrast: 120, saturation: 150, blur: 0, hue: 0, exposure: 5 },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    icon: 'coffee',
    description: 'Nostalgischer Braun-Ton',
    filters: {
      brightness: 105,
      contrast: 95,
      saturation: 80,
      blur: 0,
      hue: 0,
      sepia: 70,
      vignette: 20,
    },
  },
  {
    id: 'dramatic',
    name: 'Dramatisch',
    icon: 'bolt',
    description: 'Hoher Kontrast',
    filters: {
      brightness: 95,
      contrast: 150,
      saturation: 120,
      blur: 0,
      hue: 0,
      shadows: -20,
      highlights: 20,
      vignette: 25,
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    icon: 'cloud',
    description: 'Weiche Töne',
    filters: {
      brightness: 110,
      contrast: 85,
      saturation: 90,
      blur: 0.5,
      hue: 0,
      highlights: 15,
      exposure: 5,
    },
  },
  {
    id: 'hdr',
    name: 'HDR',
    icon: 'layer-group',
    description: 'Sehr hohe Dynamik',
    filters: {
      brightness: 105,
      contrast: 130,
      saturation: 140,
      blur: 0,
      hue: 0,
      highlights: 30,
      shadows: 30,
    },
  },
  {
    id: 'cold',
    name: 'Kalt',
    icon: 'moon',
    description: 'Kühle Töne',
    filters: {
      brightness: 100,
      contrast: 105,
      saturation: 90,
      blur: 0,
      hue: 200,
      sepia: 0,
      exposure: -5,
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    icon: 'sun',
    description: 'Warme Töne',
    filters: {
      brightness: 105,
      contrast: 100,
      saturation: 110,
      blur: 0,
      hue: 15,
      sepia: 25,
      exposure: 5,
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: 'paint-brush',
    description: 'Orange/Rosa Sonnenuntergang',
    filters: {
      brightness: 110,
      contrast: 105,
      saturation: 120,
      blur: 0,
      hue: 10,
      sepia: 30,
      vignette: 20,
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: 'wave-square',
    description: 'Blaue Meer-Stimmung',
    filters: { brightness: 100, contrast: 110, saturation: 115, blur: 0, hue: 195, exposure: -5 },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: 'tv',
    description: 'Film-Look',
    filters: {
      brightness: 95,
      contrast: 120,
      saturation: 95,
      blur: 0,
      hue: 5,
      vignette: 35,
      shadows: -15,
    },
  },
  {
    id: 'faded',
    name: 'Faded',
    icon: 'eye-slash',
    description: 'Verblasst',
    filters: { brightness: 115, contrast: 75, saturation: 70, blur: 0, hue: 0, exposure: 10 },
  },
  {
    id: 'noir',
    name: 'Noir',
    icon: 'circle',
    description: 'Film Noir Stil',
    filters: {
      brightness: 95,
      contrast: 140,
      saturation: 0,
      blur: 0,
      hue: 0,
      grayscale: 100,
      vignette: 45,
    },
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    icon: 'magic',
    description: 'Verträumt',
    filters: {
      brightness: 115,
      contrast: 80,
      saturation: 85,
      blur: 1,
      hue: 0,
      highlights: 25,
      vignette: 15,
    },
  },
];

// Icon-Name des Presets (AppIcon); ältere eigene Presets tragen noch ein Emoji
export function presetIconName(preset: Pick<FilterPreset, 'icon'>): string {
  return /^[a-z-]+$/.test(preset.icon || '') ? preset.icon! : 'sliders-h';
}
