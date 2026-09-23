import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GuideSectionHeader from '@/components/guide/GuideSectionHeader.vue';

describe('GuideSectionHeader', () => {
  it('rendert Icon, Titel und Beschreibung zentriert', () => {
    const w = mount(GuideSectionHeader, {
      props: { icon: 'fas fa-play-circle', title: 'Schnellstart', description: 'Drei Schritte' },
    });
    expect(w.find('.section-icon i').classes()).toEqual(['fas', 'fa-play-circle']);
    expect(w.find('h2').text()).toBe('Schnellstart');
    expect(w.find('p.section-description').text()).toBe('Drei Schritte');
    expect(w.classes()).not.toContain('section-header-left');
    expect(w.find('.section-icon').classes()).not.toContain('section-icon-small');
  });

  it('nutzt für align="left" die kompakte Variante ohne Beschreibung', () => {
    const w = mount(GuideSectionHeader, {
      props: { icon: 'fas fa-crop-alt', title: 'Zuschneiden', align: 'left' },
    });
    expect(w.classes()).toContain('section-header-left');
    expect(w.find('.section-icon').classes()).toContain('section-icon-small');
    expect(w.find('p').exists()).toBe(false);
  });

  it('setzt die helle Variante und eine eigene Beschreibungsfarbe', () => {
    const w = mount(GuideSectionHeader, {
      props: {
        icon: 'fas fa-shield-alt',
        title: 'Datenschutz',
        description: 'Lokal',
        light: true,
        descriptionColor: 'rgba(255,255,255,0.8)',
      },
    });
    expect(w.classes()).toContain('section-header-light');
    expect(w.find('.section-icon').classes()).toContain('section-icon-light');
    expect(w.find('p').element.style.color).toBe('rgba(255, 255, 255, 0.8)');
  });
});
