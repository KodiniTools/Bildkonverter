import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { i18n } from '@/i18n';
import SaveAsDialog from '@/components/ui/SaveAsDialog.vue';
import { useSavePrompt } from '@/composables/useSavePrompt';

function mountDialog() {
  return mount(SaveAsDialog, {
    global: { plugins: [i18n], stubs: { teleport: true } },
    attachTo: document.body,
  });
}

async function settle() {
  for (let i = 0; i < 3; i++) await nextTick();
}

describe('SaveAsDialog', () => {
  const { prompt, respond, state } = useSavePrompt();

  afterEach(() => {
    if (state.value.visible) respond(null);
    document.body.innerHTML = '';
  });

  it('zeigt den Namen ohne Endung, die Endung fest und den Hinweis zum Speicherort', async () => {
    const wrapper = mountDialog();
    void prompt('urlaub.foto.jpg');
    await settle();

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.get('.ui-dialog__title').text()).toBe(i18n.global.t('save.title'));
    expect(dialog.get('.ui-dialog__description').text()).toBe(i18n.global.t('save.hintFallback'));
    expect((dialog.get('input').element as HTMLInputElement).value).toBe('urlaub.foto');
    expect(dialog.get('.save-as__ext').text()).toBe('.jpg');
    expect(document.activeElement).toBe(dialog.get('input').element);
    wrapper.unmount();
  });

  it('Speichern liefert den neuen Namen mit Endung', async () => {
    const wrapper = mountDialog();
    const result = prompt('bild.png');
    await settle();

    await wrapper.get('input').setValue('ferien');
    await wrapper.get('form').trigger('submit');

    await expect(result).resolves.toBe('ferien.png');
    await nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('Abbrechen liefert null', async () => {
    const wrapper = mountDialog();
    const result = prompt('bild.png');
    await settle();

    const cancel = wrapper
      .findAll('.ui-dialog__footer .ui-button')
      .find((b) => b.text() === i18n.global.t('common.cancel'));
    await cancel?.trigger('click');

    await expect(result).resolves.toBeNull();
    wrapper.unmount();
  });
});
