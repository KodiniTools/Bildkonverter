/** Aus FormatConversionView ausgelagerte Bausteine: Widget und Abschnitte */
import { mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import ConversionWidget from '@/components/conversion/ConversionWidget.vue';
import ConversionBenefits from '@/components/conversion/ConversionBenefits.vue';
import ConversionFormatDetails from '@/components/conversion/ConversionFormatDetails.vue';
import ConversionSteps from '@/components/conversion/ConversionSteps.vue';
import ConversionOtherLinks from '@/components/conversion/ConversionOtherLinks.vue';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const global = { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } };
const conversion = { pair: 'png-zu-webp', from: 'PNG', to: 'WebP' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wrapper: VueWrapper<any> | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  delete window.$toast;
});

describe('ConversionWidget', () => {
  it('zeigt die Ablage mit Formatangabe und den Batch-Link', () => {
    wrapper = mount(ConversionWidget, { props: { pair: 'png-zu-webp', conversion }, global });
    expect(wrapper.get('.upload-formats').text()).toBe('PNG → WebP');
    expect(wrapper.get('input[type="file"]').attributes('accept')).toBe(
      'image/*,.tiff,.tif,.heic,.heif'
    );
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({ name: 'batch' });
  });

  it('markiert das Ziehen und warnt bei Nicht-Bildern', async () => {
    const warning = vi.fn();
    window.$toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning };
    wrapper = mount(ConversionWidget, { props: { pair: 'png-zu-webp', conversion }, global });
    const zone = wrapper.get('.upload-zone');
    await zone.trigger('dragover');
    expect(zone.classes()).toContain('drag-over');
    await zone.trigger('drop', {
      dataTransfer: { files: [new File(['x'], 'notiz.txt', { type: 'text/plain' })] },
    });
    expect(zone.classes()).not.toContain('drag-over');
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('öffnet beim Klick auf die Ablage den Dateidialog', async () => {
    wrapper = mount(ConversionWidget, { props: { pair: 'png-zu-webp', conversion }, global });
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    await wrapper.get('.upload-zone').trigger('click');
    expect(click).toHaveBeenCalled();
  });
});

describe('Abschnitte', () => {
  it('ConversionBenefits zeigt drei Vorteile', () => {
    wrapper = mount(ConversionBenefits, { global });
    expect(wrapper.findAll('.info-card')).toHaveLength(3);
  });

  it('ConversionFormatDetails zeigt Quell- und Zielformat', () => {
    wrapper = mount(ConversionFormatDetails, {
      props: { pair: 'png-zu-webp', conversion },
      global,
    });
    expect(wrapper.get('.format-box.source h3').text()).toBe('PNG');
    expect(wrapper.get('.format-box.target h3').text()).toBe('WebP');
    expect(wrapper.get('h2').text()).toBe(de.conversion['png-zu-webp'].whyTitle);
  });

  it('ConversionSteps nummeriert drei Schritte', () => {
    wrapper = mount(ConversionSteps, { global });
    expect(wrapper.findAll('.step-number').map((n) => n.text())).toEqual(['1', '2', '3']);
  });

  it('ConversionOtherLinks verlinkt jede Konvertierung', () => {
    wrapper = mount(ConversionOtherLinks, {
      props: {
        conversions: [conversion, { pair: 'jpg-zu-png', from: 'JPG', to: 'PNG' }],
      },
      global,
    });
    const links = wrapper.findAllComponents(RouterLinkStub);
    expect(links).toHaveLength(2);
    expect(links[1]!.props('to')).toEqual({
      name: 'format-conversion',
      params: { pair: 'jpg-zu-png' },
    });
    expect(links[0]!.text()).toBe('PNG → WebP');
  });
});
