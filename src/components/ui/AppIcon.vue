<template>
  <component
    :is="icon"
    v-if="icon"
    :class="['app-icon', { 'app-icon--spin': spinning }]"
    :size="size as number"
    :stroke-width="strokeWidth"
    aria-hidden="true"
    focusable="false"
  />
</template>

<script setup lang="ts">
/**
 * Icon im Lucide-Stil (Design-System v2): Outline, 24-px-Raster,
 * stroke-width 1.75, erbt currentColor. 16 px in Controls, 20 px freistehend.
 *
 * `name` akzeptiert die bisherigen Font-Awesome-Namen ('crop', 'fa-crop',
 * 'fas fa-crop', optional mit 'fa-spin').
 */
import { computed } from 'vue';
import { iconMap, parseIconName } from './iconMap';
import { logger } from '@/utils/logger';

// size: Lucide typisiert nur number, setzt den Wert aber unverändert als
// width/height-Attribut; Strings wie "20" funktionieren daher wie bisher.
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: [Number, String], default: 1.75 },
  spin: { type: Boolean, default: false },
});

const parsed = computed(() => parseIconName(props.name));

const icon = computed(() => {
  const found = (iconMap as Partial<Record<string, (typeof iconMap)[keyof typeof iconMap]>>)[
    parsed.value.key
  ];
  if (!found && parsed.value.key) logger.warn(`AppIcon: unbekanntes Icon "${props.name}"`);
  return found || null;
});

const spinning = computed(() => props.spin || parsed.value.spin);
</script>

<style scoped>
.app-icon {
  flex-shrink: 0;
  vertical-align: middle;
}

.app-icon--spin {
  animation: spin 1s linear infinite;
}
</style>
