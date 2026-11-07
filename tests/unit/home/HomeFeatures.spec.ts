import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import HomeView from '@/views/HomeView.vue';

function mountHome() {
  return mount(HomeView, {
    global: { plugins: [i18n], stubs: { 'router-link': { template: '<a><slot /></a>' } } },
  });
}

describe('HomeView: Funktionskarten', () => {
  afterEach(() => {
    i18n.global.locale.value = 'de';
  });

  it('zeigt acht Karten mit Symbol, inklusive Hintergrund entfernen und Text', () => {
    const cards = mountHome().findAll('.feature-card');
    expect(cards).toHaveLength(8);
    cards.forEach((card) => expect(card.find('.feature-icon svg').exists()).toBe(true));
    const titles = cards.map((c) => c.find('h3').text());
    expect(titles.slice(-2)).toEqual(['Hintergrund entfernen', 'Text hinzufügen und bearbeiten']);
  });

  it('übersetzt die neuen Karten ins Englische', async () => {
    i18n.global.locale.value = 'en';
    const wrapper = mountHome();
    await wrapper.vm.$nextTick();
    const titles = wrapper.findAll('.feature-card h3').map((h) => h.text());
    expect(titles.slice(-2)).toEqual(['Remove Background', 'Add and Edit Text']);
  });
});
