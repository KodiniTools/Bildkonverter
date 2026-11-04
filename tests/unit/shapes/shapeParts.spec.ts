/**
 * Teil-Bausteine des ShapesPanel: Aufteilung, Reihenfolge im DOM und
 * Bedienung über den gemeinsamen Kontext.
 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageStore } from '@/stores/imageStore';
import ShapesPanel from '@/components/features/shapes/ShapesPanel.vue';
import ShapeCategoryGrid from '@/components/features/shapes/ShapeCategoryGrid.vue';
import ShapeDrawSettings from '@/components/features/shapes/ShapeDrawSettings.vue';
import ShapeList from '@/components/features/shapes/ShapeList.vue';
import ShapeStyleControls from '@/components/features/shapes/ShapeStyleControls.vue';
import ShapeGeometryControls from '@/components/features/shapes/ShapeGeometryControls.vue';
import ShapeActions from '@/components/features/shapes/ShapeActions.vue';
import { SHAPE_CATEGORIES } from '@/utils/shapes';

const $t = (key: string) => key;
const mountPanel = () =>
  mount(ShapesPanel, {
    props: { canvasWidth: 800, canvasHeight: 600 },
    global: { mocks: { $t } },
  });

describe('ShapesPanel-Bausteine', () => {
  let store: ReturnType<typeof useImageStore>;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = useImageStore();
    store.saveState = vi.fn();
  });

  it('zeigt anfangs nur die Galerie', () => {
    const w = mountPanel();
    expect(w.findComponent(ShapeCategoryGrid).exists()).toBe(true);
    expect(w.findComponent(ShapeDrawSettings).exists()).toBe(false);
    expect(w.findComponent(ShapeList).exists()).toBe(false);
    expect(w.find('.shape-edit-section').exists()).toBe(false);
  });

  it('Reiter „Zeichnen“ blendet die Zeichen-Einstellungen ein', async () => {
    const w = mountPanel();
    await w.findAll('[role="tab"]')[SHAPE_CATEGORIES.indexOf('draw')].trigger('click');
    expect(w.findComponent(ShapeDrawSettings).exists()).toBe(true);
    await w.find('[data-shape="pen"]').trigger('click');
    expect(store.drawTool).toBe('pen');
    await w.find('.draw-done-btn').trigger('click');
    expect(store.drawTool).toBeNull();
  });

  it('Auswahl zeigt Liste und Bearbeitung in der bisherigen Reihenfolge', async () => {
    const w = mountPanel();
    await w.find('[data-shape="rect"], [data-shape="ellipse"]').trigger('click');
    expect(w.findComponent(ShapeList).exists()).toBe(true);
    const edit = w.get('.shape-edit-section');
    expect(edit.findComponent(ShapeStyleControls).exists()).toBe(true);
    expect(edit.findComponent(ShapeGeometryControls).exists()).toBe(true);
    expect(edit.findComponent(ShapeActions).exists()).toBe(true);

    // Füllung vor Deckkraft vor Aktionen, alles direkt im Bearbeiten-Abschnitt
    const html = edit.html();
    const order = ['shape-fill-toggle', 'shape-opacity', 'action-grid'].map((s) => html.indexOf(s));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(edit.find(':scope > .action-grid').exists()).toBe(true);
  });

  it('Aktionen: duplizieren, abwählen, löschen', async () => {
    const w = mountPanel();
    await w.find('[data-shape="ellipse"]').trigger('click');
    // Unter dem Raster: duplizieren, löschen, abwählen
    const buttons = () => w.findAll('.shape-edit-section > .transform-btn');
    await buttons()[0].trigger('click'); // duplizieren
    expect(store.shapes).toHaveLength(2);
    await buttons()[2].trigger('click'); // abwählen
    expect(store.selectedShapeId).toBeNull();
    expect(w.find('.shape-edit-section').exists()).toBe(false);

    await w.findAll('.shape-item')[0].trigger('click');
    await w.find('.delete-btn').trigger('click');
    expect(store.shapes).toHaveLength(1);
  });
});
