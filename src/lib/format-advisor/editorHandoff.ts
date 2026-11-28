import type { EditorPreset } from './editorPreset';

/** Übergabe vom Formatberater an den Editor (nur im Speicher, überlebt kein Neuladen). */
export interface AdvisorHandoff {
  file: File;
  preset: EditorPreset;
}

/** Query-Wert, an dem der Editor die Übergabe erkennt. */
export const ADVISOR_HANDOFF_QUERY = 'formatberater';

let pending: AdvisorHandoff | null = null;

export function setAdvisorHandoff(handoff: AdvisorHandoff): void {
  pending = handoff;
}

/** Liefert die Übergabe genau einmal. */
export function takeAdvisorHandoff(): AdvisorHandoff | null {
  const handoff = pending;
  pending = null;
  return handoff;
}
