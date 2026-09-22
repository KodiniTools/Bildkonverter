/**
 * useEditorExport
 *
 * Export-Dialog, Datei-Export, Drucken und die optionale Weiterleitung des
 * exportierten Bildes an ein anderes Kodini-Tool (Handoff). Ausgelagert aus
 * EditorView.vue, Verhalten unverändert.
 *
 * @param {object} deps
 * @param {import('vue').Ref} deps.canvas
 * @param {import('vue').Ref} deps.outputFormat
 * @param {import('vue').Ref} deps.currentFileName
 * @param {object}   deps.imageStore
 * @param {Function} deps.renderImage
 * @param {Function} deps.renderImageForExport
 * @param {Function} deps.t
 */
import { ref } from 'vue';
import { exportImage } from '@/utils/exportUtils';
import { prepareHandoff } from '@/lib/core/handoff';
import { printImage } from '@/utils/printUtils';

export function useEditorExport({
  canvas,
  outputFormat,
  currentFileName,
  imageStore,
  renderImage,
  renderImageForExport,
  t,
}) {
  // ===== EXPORT STATE =====
  const exportQuality = ref(92); // Quality-Wert (0-100)
  const isExporting = ref(false); // Loading-State beim Export
  const exportTransparent = ref(false); // Transparenter Hintergrund beim PNG-Export
  const showExportDialog = ref(false);
  const exportDialogFilename = ref('');

  // ===== FORWARD/HANDOFF STATE (nach Download zu anderem Tool weiterleiten) =====
  const showForwardOffer = ref(false);
  const forwardCanvasSnapshot = ref(null); // Kopie des exportierten Canvas
  const forwardFilename = ref('');

  // Export mit Dateiname-Dialog
  function downloadImage() {
    if (!canvas.value) return;
    exportDialogFilename.value = currentFileName.value || 'image';
    showExportDialog.value = true;
  }

  async function confirmExport() {
    showExportDialog.value = false;
    const filename = exportDialogFilename.value.trim() || currentFileName.value || 'image';

    isExporting.value = true;

    try {
      const useTransparent = outputFormat.value === 'png' && exportTransparent.value;
      renderImageForExport(useTransparent);

      const result = await exportImage(canvas.value, outputFormat.value, filename, {
        quality: exportQuality.value / 100,
        texts: imageStore.texts || [],
      });

      console.log('✅ Export erfolgreich:', result);

      // Snapshot des exportierten Canvas sichern, solange der Export-Render aktiv ist.
      // Wird für die optionale Weiterleitung an ein anderes Kodini-Tool genutzt.
      try {
        const snap = document.createElement('canvas');
        snap.width = canvas.value.width;
        snap.height = canvas.value.height;
        snap.getContext('2d').drawImage(canvas.value, 0, 0);
        forwardCanvasSnapshot.value = snap;
        forwardFilename.value = filename;
        showForwardOffer.value = true;
      } catch (snapErr) {
        console.warn('[Handoff] Snapshot für Weiterleitung fehlgeschlagen:', snapErr);
      }

      if (window.$toast) {
        window.$toast.success(
          `Bild erfolgreich als ${result.format.toUpperCase()} exportiert` +
            (result.size ? ` (${result.size})` : '')
        );
      }
    } catch (error) {
      console.error('❌ Export fehlgeschlagen:', error);

      if (window.$toast) {
        window.$toast.error(`Export fehlgeschlagen: ${error.message}`);
      }
    } finally {
      isExporting.value = false;
      renderImage();
    }
  }

  // Drucken
  async function printCurrentImage() {
    if (!canvas.value) return;

    let dataUrl = '';
    try {
      // Ohne Auswahl-Markierung rendern (wie beim Export), Hintergrund wie konfiguriert
      renderImageForExport();
      dataUrl = canvas.value.toDataURL('image/png');
    } catch (error) {
      console.error('❌ Druck-Rendering fehlgeschlagen:', error);
    } finally {
      // On-Screen-Canvas wieder mit Auswahl-Markierung herstellen
      renderImage();
    }

    try {
      await printImage(dataUrl, currentFileName.value || 'image');
    } catch (error) {
      console.error('❌ Drucken fehlgeschlagen:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.editor.printFailed', 'Drucken fehlgeschlagen'));
      }
    }
  }

  // Weiterleitung an anderes Kodini-Tool (Color-Extractor / Visualizer)
  function forwardTo(target) {
    const snap = forwardCanvasSnapshot.value;
    showForwardOffer.value = false;

    if (!snap) return;

    const name = forwardFilename.value || 'image';
    const url = prepareHandoff([{ name, canvas: snap }], target, 'bildkonverter');

    if (url) {
      // Cross-App-Navigation: die Tools liegen unter unterschiedlichen Base-Pfaden,
      // daher vollständiger Seitenwechsel statt Vue-Router.
      window.location.href = url;
    } else if (window.$toast) {
      window.$toast.error('Weiterleitung fehlgeschlagen');
    }
  }

  function dismissForwardOffer() {
    showForwardOffer.value = false;
    forwardCanvasSnapshot.value = null;
  }

  return {
    exportQuality,
    isExporting,
    exportTransparent,
    showExportDialog,
    exportDialogFilename,
    showForwardOffer,
    downloadImage,
    confirmExport,
    printCurrentImage,
    forwardTo,
    dismissForwardOffer,
  };
}
