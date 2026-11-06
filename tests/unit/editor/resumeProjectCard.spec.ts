/**
 * Fortsetzen-Karte im leeren Editor (Projekt speichern).
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import en from '@/i18n/en';
import ResumeProjectCard from '@/components/editor/canvas/ResumeProjectCard.vue';
import type { SavedProjectInfo } from '@/composables/editor/useProjectAutosave';

const project: SavedProjectInfo = {
  name: 'urlaub',
  savedAt: new Date(2026, 10, 6, 9, 5).getTime(),
  thumbnailUrl: 'blob:test',
  isCollage: true,
  layerCount: 2,
  textCount: 1,
  shapeCount: 0,
};

function mountCard(locale: 'de' | 'en', props: Partial<SavedProjectInfo> = {}, busy = false) {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
  return mount(ResumeProjectCard, {
    props: { project: { ...project, ...props }, busy },
    global: { plugins: [i18n] },
  });
}

describe('ResumeProjectCard', () => {
  it('zeigt Name, Zeitpunkt, Inhalt und Vorschaubild', () => {
    const w = mountCard('de');
    expect(w.text()).toContain('Letzte Bearbeitung fortsetzen');
    expect(w.text()).toContain('urlaub');
    expect(w.text()).toContain('06.11.2026, 09:05');
    expect(w.text()).toContain('2 Ebenen, 1 Text');
    expect(w.text()).not.toContain('Form');
    expect(w.find('img').attributes('src')).toBe('blob:test');
  });

  it('Englisch und Ersatzname ohne Dateinamen', () => {
    const w = mountCard('en', {
      name: '',
      isCollage: false,
      layerCount: 0,
      textCount: 0,
      shapeCount: 3,
    });
    expect(w.text()).toContain('Continue where you left off');
    expect(w.text()).toContain('Untitled image');
    expect(w.text()).toContain('3 shapes');
  });

  it('meldet Fortsetzen und Verwerfen, sperrt beides während des Ladens', async () => {
    const w = mountCard('de');
    const [resume, discard] = w.findAll('button');
    await resume.trigger('click');
    await discard.trigger('click');
    expect(w.emitted('resume')).toHaveLength(1);
    expect(w.emitted('discard')).toHaveLength(1);

    const busy = mountCard('de', {}, true);
    expect(busy.findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(true);
  });
});
