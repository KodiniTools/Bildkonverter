import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import {
  MAX_HISTORY_SIZE,
  toTextEditFields,
  useTextEditForm,
  type EditingText,
} from '@/composables/text/useTextEditForm';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('toTextEditFields', () => {
  it('liefert Standardwerte für einen neuen Text', () => {
    expect(toTextEditFields(null)).toEqual({
      content: '',
      fontSize: 32,
      color: '#000000',
      fontFamily: 'Arial',
      x: 50,
      y: 50,
    });
  });

  it('übernimmt den bearbeiteten Text samt id und füllt Lücken', () => {
    expect(toTextEditFields({ id: 7, content: 'Hallo', x: 0 })).toMatchObject({
      id: 7,
      content: 'Hallo',
      fontSize: 32,
      x: 50,
    });
  });
});

describe('useTextEditForm', () => {
  it('macht Änderungen rückgängig und wieder her', () => {
    const f = useTextEditForm(ref<EditingText>({ id: 1, content: 'A' }));
    expect(f.canUndo.value).toBe(false);

    f.localText.value.content = 'AB';
    f.saveToHistory();
    f.localText.value.fontSize = 40;
    f.saveToHistory();
    expect(f.canUndo.value).toBe(true);

    f.undo();
    expect(f.localText.value).toMatchObject({ content: 'AB', fontSize: 32 });
    // Während des Rückgängig-Schritts zählt keine Eingabe als neuer Eintrag
    f.saveToHistory();
    expect(f.canRedo.value).toBe(true);
    vi.runAllTimers();

    f.redo();
    expect(f.localText.value.fontSize).toBe(40);
    vi.runAllTimers();
    expect(f.canRedo.value).toBe(false);
  });

  it('verwirft Wiederherstellen-Schritte bei neuer Eingabe', () => {
    const f = useTextEditForm(ref<EditingText>(null));
    f.localText.value.content = 'x';
    f.saveToHistory();
    f.undo();
    vi.runAllTimers();
    f.localText.value.content = 'y';
    f.saveToHistory();
    expect(f.canRedo.value).toBe(false);
    f.undo();
    expect(f.localText.value.content).toBe('');
  });

  it('begrenzt den Verlauf', () => {
    const f = useTextEditForm(ref<EditingText>(null));
    for (let i = 0; i < MAX_HISTORY_SIZE + 10; i++) {
      f.localText.value.content = String(i);
      f.saveToHistory();
    }
    let steps = 0;
    while (f.canUndo.value) {
      f.undo();
      vi.runAllTimers();
      steps++;
    }
    expect(steps).toBeLessThan(MAX_HISTORY_SIZE);
  });

  it('beginnt beim Öffnen eines anderen Textes neu', async () => {
    const editing = ref<EditingText>({ id: 1, content: 'A' });
    const f = useTextEditForm(editing);
    f.localText.value.content = 'B';
    f.saveToHistory();
    editing.value = { id: 2, content: 'Z', x: 10, y: 20 };
    await nextTick();
    expect(f.localText.value).toMatchObject({ id: 2, content: 'Z' });
    expect(f.canUndo.value).toBe(false);
    expect(f.savePayload()).toEqual({
      content: 'Z',
      fontSize: 32,
      color: '#000000',
      fontFamily: 'Arial',
      x: 10,
      y: 20,
    });
  });
});
