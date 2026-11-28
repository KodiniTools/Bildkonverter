<template>
  <div class="format-advisor-view">
    <section class="advisor-intro">
      <span class="eyebrow">{{ $t('advisor.free') }}</span>
      <h1>{{ $t('advisor.title') }}</h1>
      <p class="lead">{{ $t('advisor.description') }}</p>
      <p class="privacy">
        <AppIcon name="shield-alt" :size="18" />
        {{ $t('advisor.privacy') }}
      </p>
    </section>

    <div class="advisor-grid">
      <div class="advisor-input">
        <h2>{{ $t('advisor.step1') }}</h2>
        <input
          ref="fileInput"
          type="file"
          accept="image/*,.tiff,.tif,.heic,.heif,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2,.pef,.x3f"
          class="sr-only"
          :aria-label="$t('advisor.choose')"
          @change="onInputChange"
        />
        <button
          type="button"
          class="dropzone"
          :class="{ 'dropzone--drag': dragging }"
          :aria-label="$t('advisor.choose')"
          @click="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <img
            v-if="image"
            :src="image.preview"
            :alt="$t('advisor.selected')"
            :width="image.width"
            :height="image.height"
            class="dropzone__preview"
          />
          <template v-else>
            <AppIcon name="upload" :size="32" />
            <span>{{ busy ? $t('advisor.analyzing') : $t('advisor.drop') }}</span>
          </template>
        </button>

        <div v-if="image" class="image-meta">
          <p class="image-meta__name">{{ image.file.name }}</p>
          <span>{{ image.width }} × {{ image.height }} px · {{ formatSize(image.file.size) }}</span>
          <span class="chip">{{ $t(image.isPhoto ? 'advisor.photo' : 'advisor.graphic') }}</span>
          <span v-if="image.hasTransparency" class="chip">{{ $t('advisor.transparent') }}</span>
          <span v-if="image.convertedOnServer" class="chip">{{ $t('advisor.server') }}</span>
        </div>
        <p v-if="readError" role="alert" class="read-error">{{ $t('advisor.readError') }}</p>

        <fieldset class="uses">
          <legend>{{ $t('advisor.step2') }}</legend>
          <div class="uses__list">
            <button
              v-for="use in uses"
              :key="use.id"
              type="button"
              class="use-chip"
              :aria-pressed="purpose === use.id"
              @click="purpose = use.id"
            >
              {{ use.label }}
            </button>
          </div>
        </fieldset>

        <UiButton v-if="image || purpose || readError" class="reset" @click="reset">
          <template #icon><AppIcon name="undo" :size="16" /></template>
          {{ $t('advisor.reset') }}
        </UiButton>
      </div>

      <section class="advisor-result" aria-live="polite" :aria-busy="busy">
        <template v-if="!advice">
          <h2>{{ $t('advisor.recommended') }}</h2>
          <p class="muted">{{ $t('advisor.empty') }}</p>
        </template>
        <template v-else>
          <p class="muted">{{ $t('advisor.recommended') }}</p>
          <h2 class="result-format">{{ advice.format }}</h2>
          <p>{{ advice.summary }}</p>

          <h3>{{ $t('advisor.settings') }}</h3>
          <dl class="settings">
            <div v-for="setting in advice.settings" :key="setting.name" class="settings__row">
              <dt>{{ setting.name }}</dt>
              <dd>{{ setting.value }}</dd>
            </div>
          </dl>

          <template v-if="advice.printShop">
            <h3>{{ $t('advisor.printShop') }}</h3>
            <ul class="reasons">
              <li v-for="note in advice.printShop" :key="note">{{ note }}</li>
            </ul>
          </template>

          <h3>{{ $t('advisor.why') }}</h3>
          <ul class="reasons">
            <li v-for="reason in advice.reasons" :key="reason">{{ reason }}</li>
          </ul>
          <p class="alternative">
            <span class="muted">{{ $t('advisor.alternative') }}:</span> {{ advice.alternative }}
          </p>

          <UiButton variant="primary" class="go" @click="openInEditor">
            {{ $t('advisor.editor') }}
            <AppIcon name="arrow-right" :size="16" />
          </UiButton>
          <p class="go-hint muted">{{ $t('advisor.editorHint') }}</p>
          <router-link
            v-if="conversionPair"
            :to="{ name: 'format-conversion', params: { pair: conversionPair } }"
            class="quick-link"
          >
            {{ $t('advisor.converter') }}
          </router-link>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';
import {
  recommendFormat,
  USES,
  type FormatAdvice,
  type Use,
} from '@/lib/format-advisor/formatRules';
import { recommendFormatDe, USES_DE } from '@/lib/format-advisor/formatRulesDe';
import { prepareAdvisorImage, type AdvisorImage } from '@/lib/format-advisor/formatAnalysis';
import { findConversionPair } from '@/lib/format-advisor/conversionTarget';
import { editorPresetFor } from '@/lib/format-advisor/editorPreset';
import { ADVISOR_HANDOFF_QUERY, setAdvisorHandoff } from '@/lib/format-advisor/editorHandoff';
import { formatSize } from '@/utils/fileUtils';

const { locale } = useI18n();
const router = useRouter();

const fileInput = ref<HTMLInputElement | null>(null);
const image = shallowRef<AdvisorImage | null>(null);
const purpose = ref<Use | null>(null);
const busy = ref(false);
const readError = ref(false);
const dragging = ref(false);

/** Zählt Analysen hoch, damit eine langsame ältere Datei kein neueres Ergebnis überschreibt. */
let requestId = 0;

const uses = computed(() => (locale.value === 'en' ? USES : USES_DE));

const advice = computed<FormatAdvice | null>(() => {
  if (!image.value || !purpose.value) return null;
  const recommend = locale.value === 'en' ? recommendFormat : recommendFormatDe;
  return recommend(purpose.value, image.value);
});

/** Passende Format-Landingpage (z. B. png-zu-webp) für schnelles Umwandeln ohne Einstellungen. */
const conversionPair = computed<string | null>(() =>
  image.value && advice.value
    ? findConversionPair(image.value.file.name, advice.value.format)
    : null
);

/** Öffnet den Editor mit Bild und den empfohlenen Einstellungen. */
function openInEditor(): void {
  if (!image.value || !purpose.value) return;
  setAdvisorHandoff({
    file: image.value.file,
    preset: editorPresetFor(purpose.value, image.value),
  });
  void router.push({ name: 'editor', query: { from: ADVISOR_HANDOFF_QUERY } });
}

// Objekt-URL der alten Vorschau freigeben, sobald ein neues Bild kommt oder es entfernt wird
watch(image, (_next, previous) => {
  if (previous) URL.revokeObjectURL(previous.preview);
});

onBeforeUnmount(() => {
  requestId += 1;
  if (image.value) URL.revokeObjectURL(image.value.preview);
});

async function analyze(file: File | undefined): Promise<void> {
  if (!file) return;
  const id = ++requestId;
  busy.value = true;
  readError.value = false;
  image.value = null;
  try {
    const prepared = await prepareAdvisorImage(file);
    if (id !== requestId) {
      URL.revokeObjectURL(prepared.preview);
      return;
    }
    image.value = prepared;
  } catch {
    if (id === requestId) readError.value = true;
  } finally {
    if (id === requestId) busy.value = false;
  }
}

function onInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  void analyze(input.files?.[0]);
  input.value = '';
}

function onDrop(event: DragEvent): void {
  dragging.value = false;
  void analyze(event.dataTransfer?.files[0]);
}

function reset(): void {
  requestId += 1;
  image.value = null;
  purpose.value = null;
  busy.value = false;
  readError.value = false;
}
</script>

<style lang="scss" scoped>
.format-advisor-view {
  max-width: 1160px;
  margin-inline: auto;
  padding: var(--ds-space-12) var(--ds-space-6) var(--ds-space-16);

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4) var(--ds-space-12);
  }
}

.advisor-intro {
  max-width: 720px;

  h1 {
    margin: var(--ds-space-4) 0 0;
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-regular);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--bild-hero-title-gold);

    @media (max-width: 768px) {
      font-size: var(--ds-text-2xl);
    }
  }

  .lead {
    margin: var(--ds-space-4) 0 0;
    font-size: var(--ds-text-lg);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
  }

  .privacy {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    margin: var(--ds-space-3) 0 0;
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);

    :deep(svg) {
      flex-shrink: 0;
      color: var(--ds-link);
    }
  }
}

.eyebrow,
.chip {
  display: inline-flex;
  align-items: center;
  padding: var(--ds-space-1) var(--ds-space-3);
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-full);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.advisor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--ds-space-8);
  align-items: start;
  margin-top: var(--ds-space-10);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

h2 {
  margin: 0;
  font-size: var(--ds-text-xl);
  font-weight: var(--ds-weight-regular);
  color: var(--ds-text);
}

h3 {
  margin: var(--ds-space-6) 0 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-regular);
  color: var(--ds-text);
}

.muted {
  color: var(--ds-text-2);
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  width: 100%;
  min-height: 240px;
  margin-top: var(--ds-space-4);
  padding: var(--ds-space-6);
  overflow: hidden;
  font: inherit;
  color: var(--ds-text-2);
  background: color-mix(in srgb, var(--ds-surface-1) 92%, var(--bild-layout-cyan));
  border: var(--ds-border-width) dashed
    color-mix(in srgb, var(--ds-border-strong) 70%, var(--bild-layout-cyan));
  border-radius: var(--ds-radius-lg);
  cursor: pointer;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    background-color var(--ds-duration) var(--ds-ease);

  :deep(svg) {
    color: var(--ds-link);
  }

  &:hover,
  &--drag {
    border-color: var(--ds-accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &__preview {
    width: 100%;
    max-height: 256px;
    height: auto;
    object-fit: contain;
  }
}

.image-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
  font-size: var(--ds-text-md);
  color: var(--ds-text-2);

  &__name {
    width: 100%;
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.read-error {
  margin: var(--ds-space-3) 0 0;
  color: var(--ds-danger);
}

.uses {
  margin: var(--ds-space-8) 0 0;
  padding: 0;
  border: 0;

  legend {
    padding: 0;
    font-size: var(--ds-text-xl);
    color: var(--ds-text);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-space-2);
    margin-top: var(--ds-space-4);
  }
}

.use-chip {
  min-height: var(--ds-control-md);
  padding: var(--ds-space-2) var(--ds-space-4);
  font: inherit;
  font-size: var(--ds-text-md);
  text-align: start;
  color: var(--ds-text);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-full);
  cursor: pointer;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    background-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-accent);
  }

  &[aria-pressed='true'] {
    color: #fff;
    background: var(--bild-layout-gold);
    background-image: var(--bild-layout-gold-gradient);
    border-color: var(--bild-layout-gold);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.reset {
  margin-top: var(--ds-space-6);
}

.advisor-result {
  min-width: 0;
  padding-left: var(--ds-space-8);
  border-left: var(--ds-border-width) solid var(--ds-border);

  @media (max-width: 900px) {
    padding: var(--ds-space-6) 0 0;
    border-left: 0;
    border-top: var(--ds-border-width) solid var(--ds-border);
  }

  p {
    margin: var(--ds-space-4) 0 0;
    line-height: var(--ds-leading);
  }

  > p.muted:first-child {
    margin-top: 0;
  }
}

.result-format {
  margin-top: var(--ds-space-2);
  font-size: var(--ds-text-3xl);
  color: var(--bild-hero-title-blue);
}

.settings {
  margin: var(--ds-space-2) 0 0;

  &__row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--ds-space-4);
    padding: var(--ds-space-3) 0;
    font-size: var(--ds-text-md);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  dt {
    color: var(--ds-text-2);
    overflow-wrap: anywhere;
  }

  dd {
    margin: 0;
    color: var(--ds-text);
    overflow-wrap: anywhere;
  }
}

.reasons {
  margin: var(--ds-space-3) 0 0;
  padding-left: var(--ds-space-5);
  font-size: var(--ds-text-md);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);

  li + li {
    margin-top: var(--ds-space-2);
  }
}

.alternative {
  font-size: var(--ds-text-md);
}

.go {
  margin-top: var(--ds-space-6);
}

.go-hint {
  margin: var(--ds-space-2) 0 0;
  font-size: var(--ds-text-sm);
}

.quick-link {
  display: inline-block;
  margin-top: var(--ds-space-3);
  font-size: var(--ds-text-md);
  color: var(--ds-link);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
