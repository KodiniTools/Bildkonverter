/**
 * useTransformHandlers
 *
 * Bündelt alle Event-Handler rund um die Bild-Transformationen
 * (Deckkraft, Rotation, Skalierung, Rahmen, Schatten, Neigung, Flip,
 * Undo/Redo/Commit). Ausgelagert aus EditorView.vue, um die View schlank
 * zu halten. Verhalten unverändert.
 *
 * @param {object}   deps
 * @param {object}   deps.transform    useTransform()-Composable-Instanz
 * @param {Function} deps.renderImage  Rendert das Canvas neu
 * @param {Function} deps.t            i18n-Übersetzungsfunktion
 */
export function useTransformHandlers({ transform, renderImage, t }) {
  function makeHandler(setter) {
    return (value) => {
      setter(value);
      renderImage();
    };
  }
  function makeActionHandler(action, toastKey) {
    return () => {
      action();
      renderImage();
      if (toastKey && window.$toast) window.$toast.success(t(toastKey));
    };
  }

  const handleOpacityUpdate = makeHandler((v) => transform.setOpacity(v));
  const handleRotationUpdate = makeHandler((v) => transform.setRotation(v));
  const handleScaleUpdate = makeHandler((v) => transform.setScale(v));
  const handleBorderRadiusUpdate = makeHandler((v) => transform.setBorderRadius(v));
  const handleBorderWidthUpdate = makeHandler((v) => transform.setBorderWidth(v));
  const handleBorderColorUpdate = makeHandler((v) => transform.setBorderColor(v));
  const handleShadowEnabledUpdate = makeHandler((v) => transform.setShadowEnabled(v));
  const handleShadowOffsetXUpdate = makeHandler((v) => transform.setShadowOffsetX(v));
  const handleShadowOffsetYUpdate = makeHandler((v) => transform.setShadowOffsetY(v));
  const handleShadowBlurUpdate = makeHandler((v) => transform.setShadowBlur(v));
  const handleShadowColorUpdate = makeHandler((v) => transform.setShadowColor(v));
  const handleShadowOpacityUpdate = makeHandler((v) => transform.setShadowOpacity(v));
  const handleSkewXUpdate = makeHandler((v) => transform.setSkewX(v));
  const handleSkewYUpdate = makeHandler((v) => transform.setSkewY(v));
  const handleRotate90 = makeActionHandler(() => transform.rotate90(), 'toast.transform.rotated90');
  const handleRotate90Counter = makeActionHandler(
    () => transform.rotate90Counter(),
    'toast.transform.rotated90'
  );
  const handleRotate180 = makeActionHandler(() => transform.rotate180(), 'toast.transform.rotated180');
  const handleFlipHorizontal = makeActionHandler(
    () => transform.flipHorizontal(),
    'toast.transform.flippedHorizontal'
  );
  const handleFlipVertical = makeActionHandler(
    () => transform.flipVertical(),
    'toast.transform.flippedVertical'
  );
  const handleResetPan = makeActionHandler(() => transform.resetPan(), 'toast.transform.panReset');

  function handleUndoTransform() {
    if (transform.undoTransform()) {
      renderImage();
      if (window.$toast) window.$toast.info(t('toast.transform.undo', 'Transformation rückgängig'));
    }
  }

  function handleRedoTransform() {
    if (transform.redoTransform()) {
      renderImage();
      if (window.$toast)
        window.$toast.info(t('toast.transform.redo', 'Transformation wiederhergestellt'));
    }
  }

  function handleCommitTransform() {
    transform.commitTransform();
  }

  return {
    handleOpacityUpdate,
    handleRotationUpdate,
    handleScaleUpdate,
    handleBorderRadiusUpdate,
    handleBorderWidthUpdate,
    handleBorderColorUpdate,
    handleShadowEnabledUpdate,
    handleShadowOffsetXUpdate,
    handleShadowOffsetYUpdate,
    handleShadowBlurUpdate,
    handleShadowColorUpdate,
    handleShadowOpacityUpdate,
    handleSkewXUpdate,
    handleSkewYUpdate,
    handleRotate90,
    handleRotate90Counter,
    handleRotate180,
    handleFlipHorizontal,
    handleFlipVertical,
    handleResetPan,
    handleUndoTransform,
    handleRedoTransform,
    handleCommitTransform,
  };
}
