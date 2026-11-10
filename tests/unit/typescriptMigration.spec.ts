/**
 * Sperrklinke für die Umstellung auf TypeScript (Plan: Typisierung Bildkonverter).
 *
 * - Neue JavaScript-Dateien in src/, tests/, e2e/ oder im Projektwurzelordner sind
 *   nicht erlaubt.
 * - Neue .vue-Dateien mit <script> brauchen lang="ts".
 * - Wer eine Datei umstellt, streicht sie aus der passenden Liste. Steht eine Datei
 *   noch in der Liste, existiert aber nicht mehr als JS, schlägt der Test ebenfalls
 *   fehl. So schrumpfen die Listen bis zum Ende auf null.
 *
 * Bewusst ausgenommen: backend-deploy/ (eigener Node-Dienst), public/, src-tauri/,
 * Build-Ausgaben und node_modules.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const JS_EXTENSIONS = ['.js', '.mjs', '.cjs'];

/** JavaScript-Dateien, die noch auf ihre Umstellung warten. */
const ALLOWED_JS_FILES: readonly string[] = [
  'deploy-check.js',
  'eslint.config.js',
  'generate-fonts.js',
  'src/composables/editor/useBackgroundRemoval.js',
  'src/composables/editor/useEditorDetach.js',
  'src/composables/editor/useEditorDistort.js',
  'src/composables/editor/useEditorExport.js',
  'src/composables/editor/useEditorHistory.js',
  'src/composables/editor/useEditorKeyboard.js',
  'src/composables/editor/useEditorPreview.js',
  'src/composables/editor/useEditorResize.js',
  'src/composables/editor/useEditorText.js',
  'src/composables/editor/useImageInfo.js',
  'src/composables/editor/useShapeInteraction.js',
  'src/composables/editor/useTransformHandlers.js',
  'src/composables/useBatchConversion.js',
  'src/composables/useCrop.js',
  'src/composables/useImageLayerInteraction.js',
  'src/composables/useLayerPanel.js',
  'src/composables/useTransform.js',
  'tests/browser/canvasRenderer.spec.js',
  'tests/browser/distort.spec.js',
  'tests/browser/exif.spec.js',
  'tests/browser/helpers.js',
  'tests/browser/imageStoreHistory.spec.js',
  'tests/browser/imageWorker.spec.js',
  'tests/browser/projectAutosave.spec.js',
  'tests/browser/shapes.spec.js',
  'tests/browser/useBatchConversion.spec.js',
  'tests/browser/useEditorDetach.spec.js',
  'tests/browser/useEditorHistory.spec.js',
  'tests/browser/useEditorResize.spec.js',
  'tests/unit/GuideSectionHeader.spec.js',
  'tests/unit/designTokens.spec.js',
  'tests/unit/i18n.spec.js',
  'tests/unit/shapes.spec.js',
  'tests/unit/sidebarPanels.spec.js',
  'tests/unit/sliderControls.spec.js',
  'tests/unit/textPanelPosition.spec.js',
  'tests/unit/warpImage.spec.js',
  'vite.config.js',
  'vitest.config.js',
];

/** .vue-Dateien, deren <script> noch kein lang="ts" hat. */
const ALLOWED_JS_VUE_FILES: readonly string[] = [
  'src/App.vue',
  'src/components/dev/PerformanceMonitor.vue',
  'src/components/editor/PreviewModal.vue',
  'src/components/editor/sidebar/AdjustmentsPanel.vue',
  'src/components/editor/sidebar/BackgroundPanel.vue',
  'src/components/editor/sidebar/DetachPanel.vue',
  'src/components/editor/sidebar/EffectsPanel.vue',
  'src/components/editor/sidebar/ExportPanel.vue',
  'src/components/editor/sidebar/FilterSlider.vue',
  'src/components/editor/sidebar/LightColorPanel.vue',
  'src/components/editor/sidebar/ResizePanel.vue',
  'src/components/features/HandoffReceiver.vue',
  'src/components/features/KeyboardShortcuts.vue',
  'src/components/features/LayerControlPanel.vue',
  'src/components/features/TransformPanel.vue',
  'src/components/features/layer-control/PanelTopBar.vue',
  'src/components/features/layer-control/TextTab.vue',
  'src/components/features/shapes/ColorField.vue',
  'src/components/features/shapes/ShapeIcon.vue',
  'src/components/features/transform/CropPanel.vue',
  'src/components/features/transform/TextListPanel.vue',
  'src/components/guide/GuideSectionHeader.vue',
  'src/components/layout/AppHeader.vue',
  'src/components/ui/AppIcon.vue',
  'src/components/ui/HistoryActions.vue',
  'src/components/ui/NumberSpinner.vue',
  'src/views/AboutView.vue',
  'src/views/EditorView.vue',
  'src/views/FaqView.vue',
  'src/views/GuideView.vue',
  'src/views/HomeView.vue',
  'src/views/NotFoundView.vue',
];

const toPosix = (path: string): string => path.split(sep).join('/');

function collectFiles(
  dir: string,
  accept: (name: string) => boolean,
  out: string[] = []
): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, accept, out);
    } else if (accept(entry)) {
      out.push(toPosix(relative(ROOT, full)));
    }
  }
  return out;
}

const isJs = (name: string): boolean => JS_EXTENSIONS.some((ext) => name.endsWith(ext));

function currentJsFiles(): string[] {
  const nested = ['src', 'tests', 'e2e'].flatMap((dir) => collectFiles(join(ROOT, dir), isJs));
  const rootFiles = readdirSync(ROOT).filter(
    (name) => isJs(name) && statSync(join(ROOT, name)).isFile()
  );
  return [...nested, ...rootFiles].sort();
}

function currentJsVueFiles(): string[] {
  return collectFiles(join(ROOT, 'src'), (name) => name.endsWith('.vue'))
    .filter((path) => {
      const source = readFileSync(join(ROOT, path), 'utf8');
      const scripts = source.match(/<script\b[^>]*>/g) ?? [];
      return scripts.some((tag) => !/\blang=["']ts["']/.test(tag));
    })
    .sort();
}

describe('TypeScript-Umstellung (Sperrklinke)', () => {
  it('keine neuen JavaScript-Dateien', () => {
    const unexpected = currentJsFiles().filter((path) => !ALLOWED_JS_FILES.includes(path));
    expect(unexpected, 'Neue Dateien bitte direkt in TypeScript anlegen').toEqual([]);
  });

  it('umgestellte JavaScript-Dateien sind aus der Liste gestrichen', () => {
    const current = new Set(currentJsFiles());
    const stale = ALLOWED_JS_FILES.filter((path) => !current.has(path));
    expect(stale, 'Diese Einträge aus ALLOWED_JS_FILES entfernen').toEqual([]);
  });

  it('neue .vue-Dateien nutzen <script lang="ts">', () => {
    const unexpected = currentJsVueFiles().filter((path) => !ALLOWED_JS_VUE_FILES.includes(path));
    expect(unexpected, 'Bitte <script setup lang="ts"> verwenden').toEqual([]);
  });

  it('umgestellte .vue-Dateien sind aus der Liste gestrichen', () => {
    const current = new Set(currentJsVueFiles());
    const stale = ALLOWED_JS_VUE_FILES.filter((path) => !current.has(path));
    expect(stale, 'Diese Einträge aus ALLOWED_JS_VUE_FILES entfernen').toEqual([]);
  });

  it('die Listen enthalten keine Duplikate', () => {
    expect(new Set(ALLOWED_JS_FILES).size).toBe(ALLOWED_JS_FILES.length);
    expect(new Set(ALLOWED_JS_VUE_FILES).size).toBe(ALLOWED_JS_VUE_FILES.length);
  });
});
