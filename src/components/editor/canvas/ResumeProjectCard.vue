<template>
  <section class="resume-project" aria-labelledby="resume-project-title">
    <div class="resume-project__thumb" aria-hidden="true">
      <img v-if="project.thumbnailUrl" :src="project.thumbnailUrl" alt="" />
      <AppIcon v-else :name="project.isCollage ? 'layer-group' : 'image'" :size="24" />
    </div>
    <div class="resume-project__body">
      <h3 id="resume-project-title" class="resume-project__title">
        {{ $t('editor.project.resumeTitle') }}
      </h3>
      <p class="resume-project__name">{{ displayName }}</p>
      <p class="resume-project__meta">
        <AppIcon name="clock" :size="14" />
        <span>{{ $t('editor.project.savedAt', { date: savedAtText }) }}</span>
        <template v-if="details">
          <span aria-hidden="true">·</span>
          <span>{{ details }}</span>
        </template>
      </p>
      <p class="resume-project__hint">{{ $t('editor.project.localHint') }}</p>
    </div>
    <div class="resume-project__actions">
      <UiButton variant="primary" size="sm" :disabled="busy" @click="emit('resume')">
        <template #icon><AppIcon name="history" /></template>
        {{ $t('editor.project.resume') }}
      </UiButton>
      <UiButton variant="ghost" size="sm" :disabled="busy" @click="emit('discard')">
        {{ $t('editor.project.discard') }}
      </UiButton>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Angebot im leeren Editor, die zuletzt lokal gesicherte Bearbeitung
 * fortzusetzen (siehe useProjectAutosave).
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';
import type { SavedProjectInfo } from '@/composables/editor/useProjectAutosave';

const props = defineProps<{
  project: SavedProjectInfo;
  busy?: boolean;
}>();

const emit = defineEmits<{
  resume: [];
  discard: [];
}>();

const { t, locale } = useI18n({ useScope: 'global' });

const displayName = computed(
  () =>
    props.project.name ||
    (props.project.isCollage ? t('editor.project.unnamedCollage') : t('editor.project.unnamed'))
);

const savedAtText = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(props.project.savedAt)
);

const details = computed(() => {
  const parts: string[] = [];
  const { layerCount, textCount, shapeCount, isCollage } = props.project;
  if (isCollage && layerCount) parts.push(t('editor.project.layers', layerCount));
  if (textCount) parts.push(t('editor.project.texts', textCount));
  if (shapeCount) parts.push(t('editor.project.shapes', shapeCount));
  return parts.join(', ');
});
</script>

<style scoped lang="scss">
.resume-project {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  width: 100%;
  padding: var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-1);
  box-sizing: border-box;

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
}

.resume-project__thumb {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  color: var(--ds-text-3);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.resume-project__body {
  flex: 1 1 200px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}

.resume-project__title {
  margin: 0;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.resume-project__name {
  margin: 0;
  font-size: var(--ds-text-sm);
  color: var(--ds-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-project__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-1) var(--ds-space-2);
  margin: 0;
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
  font-variant-numeric: tabular-nums;
}

.resume-project__hint {
  margin: 0;
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}

.resume-project__actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);

  @media (max-width: 560px) {
    flex-direction: row;
    width: 100%;

    > * {
      flex: 1;
    }
  }
}
</style>
