/**
 * Druck-Utility: Öffnet den nativen Druckdialog des Browsers für ein Bild.
 *
 * Verwendet ein unsichtbares <iframe> statt window.open(), damit Popup-Blocker
 * nicht greifen und die aktuelle Seite unverändert bleibt. Das Bild wird
 * proportional auf die Druckseite eingepasst (max. 100 % Breite/Höhe).
 */

const CLEANUP_FALLBACK_MS = 60_000;

/**
 * Escaped HTML-Sonderzeichen für die sichere Einbettung in ein Attribut.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Druckt ein Bild (Data-URL oder Blob-URL) über den Browser-Druckdialog.
 *
 * @param {string} imageUrl - Data-URL oder Blob-URL des Bildes
 * @param {string} [title='image'] - Dokumenttitel (erscheint u. a. in der Kopfzeile/als PDF-Name)
 * @returns {Promise<void>} Resolved, sobald der Druckdialog geöffnet wurde
 */
export function printImage(imageUrl, title = 'image') {
  return new Promise((resolve, reject) => {
    if (typeof imageUrl !== 'string' || !imageUrl) {
      reject(new Error('Kein Bild zum Drucken vorhanden'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      iframe.remove();
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const win = iframe.contentWindow;

    if (!doc || !win) {
      cleanup();
      reject(new Error('Druck-Frame konnte nicht erstellt werden'));
      return;
    }

    const safeTitle = escapeHtml(title || 'image');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; }
    img { max-width: 100%; max-height: 100vh; width: auto; height: auto; display: block; }
    @page { margin: 10mm; }
    @media print {
      body { height: auto; }
      img { max-height: 100%; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <img id="print-target" alt="${safeTitle}">
</body>
</html>`);
    doc.close();

    const img = doc.getElementById('print-target');

    img.onerror = () => {
      cleanup();
      reject(new Error('Bild konnte für den Druck nicht geladen werden'));
    };

    img.onload = () => {
      // Nach dem Drucken (oder Abbrechen) aufräumen; Fallback falls afterprint nicht feuert
      win.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, CLEANUP_FALLBACK_MS);

      try {
        win.focus();
        win.print();
        resolve();
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.src = imageUrl;
  });
}
