/** Aus FilterPresets ausgelagert: Preset-Daten, useFilterPresets, PresetTile */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import PresetTile from '@/components/editor/presets/PresetTile.vue';
import FilterPresets from '@/components/editor/FilterPresets.vue';
import { DEFAULT_PRESETS, presetIconName } from '@/composables/presets/defaultPresets';
import {
  PRESETS_STORAGE_KEY,
  useFilterPresets,
  type FilterPresetsOptions,
} from '@/composables/presets/useFilterPresets';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const global = { plugins: [i18n] };

let wrapper: VueWrapper | null = null;
const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() };

beforeEach(() => {
  window.$toast = toast;
  localStorage.clear();
});
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.restoreAllMocks();
  vi.clearAllMocks();
  delete window.$toast;
});

function withPresets(patch: Partial<FilterPresetsOptions> = {}) {
  let api!: ReturnType<typeof useFilterPresets>;
  const options: FilterPresetsOptions = {
    getFilters: () => ({ brightness: 120, contrast: 90 }),
    onApply: vi.fn(),
    confirm: vi.fn(async () => true),
    t: (key) => key,
    ...patch,
  };
  wrapper = mount(
    defineComponent({
      setup() {
        api = useFilterPresets(options);
        return () => h('div');
      },
    })
  );
  return { api, options };
}

describe('defaultPresets', () => {
  it('hat 16 Standard-Presets mit eindeutigen ids', () => {
    expect(DEFAULT_PRESETS).toHaveLength(16);
    expect(new Set(DEFAULT_PRESETS.map((p) => p.id)).size).toBe(16);
    expect(DEFAULT_PRESETS[0]!.id).toBe('normal');
  });

  it('ersetzt Emoji-Icons alter Presets durch sliders-h', () => {
    expect(presetIconName({ icon: 'sun' })).toBe('sun');
    expect(presetIconName({ icon: '🌅' })).toBe('sliders-h');
    expect(presetIconName({})).toBe('sliders-h');
  });
});

describe('useFilterPresets', () => {
  it('wendet ein Preset an und merkt es als aktiv', () => {
    const { api, options } = withPresets();
    api.applyPreset(DEFAULT_PRESETS[1]!);
    expect(api.activePreset.value).toBe('vintage');
    expect(options.onApply).toHaveBeenCalledWith(DEFAULT_PRESETS[1]);
    api.resetActivePreset();
    expect(api.activePreset.value).toBeNull();
  });

  it('speichert ein eigenes Preset mit den aktuellen Filtern', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(' Mein Look ').mockReturnValueOnce('');
    const { api } = withPresets();
    api.showSaveDialog();
    const saved = api.customPresets.value[0]!;
    expect(saved).toMatchObject({
      name: 'Mein Look',
      icon: 'sliders-h',
      description: 'presets.custom',
      filters: { brightness: 120, contrast: 90 },
      custom: true,
    });
    expect(JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY)!)).toHaveLength(1);
    expect(api.allPresets.value).toHaveLength(17);
  });

  it('bricht ohne Namen ab', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(null);
    const { api } = withPresets();
    api.showSaveDialog();
    expect(api.customPresets.value).toHaveLength(0);
  });

  it('lädt eigene Presets beim Mounten und löscht nach Bestätigung', async () => {
    localStorage.setItem(
      PRESETS_STORAGE_KEY,
      JSON.stringify([{ id: 'custom_1', name: 'A', filters: {}, custom: true }])
    );
    const confirm = vi.fn(async () => false);
    const { api } = withPresets({ confirm });
    expect(api.customPresets.value).toHaveLength(1);

    await api.deletePreset('custom_1');
    expect(api.customPresets.value).toHaveLength(1);

    confirm.mockResolvedValueOnce(true);
    api.activePreset.value = 'custom_1';
    await api.deletePreset('custom_1');
    expect(api.customPresets.value).toHaveLength(0);
    expect(api.activePreset.value).toBeNull();
    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toBe('[]');
  });

  it('importiert eine Preset-Liste und lehnt anderes JSON ab', async () => {
    const { api } = withPresets();
    await api.importPresetFile(
      new File([JSON.stringify([{ id: 'x', name: 'X', filters: {} }])], 'p.json')
    );
    expect(api.customPresets.value).toHaveLength(1);
    expect(toast.success).toHaveBeenCalledWith('toast.presets.imported');

    await api.importPresetFile(new File(['{"a":1}'], 'p.json'));
    expect(api.customPresets.value).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith(
      'toast.presets.importError: presets.errors.invalidFormat'
    );
  });

  it('warnt beim Export ohne eigene Presets', () => {
    const { api } = withPresets();
    api.exportPresets();
    expect(toast.warning).toHaveBeenCalledWith('toast.presets.noCustomPresets');
  });
});

describe('PresetTile', () => {
  it('meldet Anwenden und Löschen getrennt', async () => {
    wrapper = mount(PresetTile, {
      props: { preset: { id: 'c', name: 'Eigen', filters: {}, custom: true }, active: true },
      global,
    });
    expect(wrapper.classes()).toContain('active');
    expect(wrapper.get('.preset-name').text()).toBe('Eigen');
    await wrapper.get('.delete-btn').trigger('click');
    expect(wrapper.emitted('delete')).toHaveLength(1);
    expect(wrapper.emitted('apply')).toBeUndefined();
    await wrapper.trigger('click');
    expect(wrapper.emitted('apply')).toHaveLength(1);
  });

  it('zeigt bei Standard-Presets keinen Löschknopf', () => {
    wrapper = mount(PresetTile, { props: { preset: DEFAULT_PRESETS[0]!, active: false }, global });
    expect(wrapper.find('.delete-btn').exists()).toBe(false);
  });
});

describe('FilterPresets', () => {
  it('rendert alle Presets und gibt das gewählte nach außen', async () => {
    const presets = mount(FilterPresets, { props: { filters: { brightness: 100 } }, global });
    wrapper = presets;
    const tiles = presets.findAll('.preset-btn');
    expect(tiles).toHaveLength(16);
    await tiles[2]!.trigger('click');
    expect(presets.emitted('apply-preset')![0]).toEqual([DEFAULT_PRESETS[2]]);
    expect(tiles[2]!.classes()).toContain('active');
    presets.vm.resetActivePreset();
    await presets.vm.$nextTick();
    expect(tiles[2]!.classes()).not.toContain('active');
  });
});
