/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // Standard-Shim von Vite; vue-tsc nutzt die echten SFC-Typen
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

/** Eigene Umgebungsvariablen (`.env*`). Alle optional: Web-Build setzt keine davon. */
interface ImportMetaEnv {
  /** Basis-URL der Backend-API; gesetzt im Desktop-Build (`.env.desktop`). */
  readonly VITE_API_BASE_URL?: string;
  /** Angezeigte App-Version im Entwicklungs-Log. */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
