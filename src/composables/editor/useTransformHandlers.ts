/**
 * useTransformHandlers
 *
 * Bündelt alle Event-Handler rund um die Bild-Transformationen
 * (Deckkraft, Rotation, Skalierung, Rahmen, Schatten, Neigung, Verzerren,
 * Flip, Commit). Ausgelagert aus EditorView.vue, um die View schlank
 * zu halten. Verhalten unverändert.
 */
import type { useTransform } from '@/composables/useTransform';

export interface TransformHandlersDeps {
  /** useTransform()-Composable-Instanz */
  transform: ReturnType<typeof useTransform>;
  /** Rendert das Canvas neu */
  renderImage: () => void;
  /** i18n-Übersetzungsfunktion */
  t: (key: string) => string;
  /** Speichert den Gesamt-Editor-State (gemeinsame Undo/Redo-Historie) */
  saveHistory?: () => void;
}

export function useTransformHandlers({
  transform,
  renderImage,
  t,
  saveHistory,
}: TransformHandlersDeps) {
  function makeHandler<V>(setter: (value: V) => void) {
    return (value: V) => {
      setter(value);
      renderImage();
    };
  }
  function makeActionHandler(action: () => void, toastKey?: string) {
    return () => {
      action();
      renderImage();
      if (toastKey && window.$toast) window.$toast.success(t(toastKey));
    };
  }

  const handleOpacityUpdate = makeHandler((v: number) => transform.setOpacity(v));
  const handleRotationUpdate = makeHandler((v: number) => transform.setRotation(v));
  const handleScaleUpdate = makeHandler((v: number) => transform.setScale(v));
  const handleBorderRadiusUpdate = makeHandler((v: number) => transform.setBorderRadius(v));
  const handleBorderWidthUpdate = makeHandler((v: number) => transform.setBorderWidth(v));
  const handleBorderColorUpdate = makeHandler((v: string) => transform.setBorderColor(v));
  const handleShadowEnabledUpdate = makeHandler((v: boolean) => transform.setShadowEnabled(v));
  const handleShadowOffsetXUpdate = makeHandler((v: number) => transform.setShadowOffsetX(v));
  const handleShadowOffsetYUpdate = makeHandler((v: number) => transform.setShadowOffsetY(v));
  const handleShadowBlurUpdate = makeHandler((v: number) => transform.setShadowBlur(v));
  const handleShadowColorUpdate = makeHandler((v: string) => transform.setShadowColor(v));
  const handleShadowOpacityUpdate = makeHandler((v: number) => transform.setShadowOpacity(v));
  const handleSkewXUpdate = makeHandler((v: number) => transform.setSkewX(v));
  const handleSkewYUpdate = makeHandler((v: number) => transform.setSkewY(v));
  const handleRotate90 = makeActionHandler(() => transform.rotate90(), 'toast.transform.rotated90');
  const handleRotate90Counter = makeActionHandler(
    () => transform.rotate90Counter(),
    'toast.transform.rotated90'
  );
  const handleRotate180 = makeActionHandler(
    () => transform.rotate180(),
    'toast.transform.rotated180'
  );
  const handleFlipHorizontal = makeActionHandler(
    () => transform.flipHorizontal(),
    'toast.transform.flippedHorizontal'
  );
  const handleFlipVertical = makeActionHandler(
    () => transform.flipVertical(),
    'toast.transform.flippedVertical'
  );
  const handleResetPan = makeActionHandler(() => transform.resetPan(), 'toast.transform.panReset');

  // Freies Verzerren: diskrete Aktionen landen sofort in der Historie
  function handleToggleDistort() {
    transform.toggleDistort();
    renderImage();
    if (saveHistory) saveHistory();
  }
  function handleResetDistort() {
    transform.resetDistort();
    renderImage();
    if (saveHistory) saveHistory();
  }

  // Slider-Ende: Transformationen in die gemeinsame Editor-Historie schreiben,
  // damit die zentrale Undo/Redo-Funktion sie umfasst.
  function handleCommitTransform() {
    if (saveHistory) saveHistory();
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
    handleToggleDistort,
    handleResetDistort,
    handleCommitTransform,
  };
}
