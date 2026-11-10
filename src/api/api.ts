import { logger } from '@/utils/logger';

/** Ausschnitt aus import.meta.env, den getBaseURL braucht */
export interface ApiEnv {
  PROD?: boolean;
  VITE_API_BASE_URL?: string;
}

export interface ConvertImageOptions {
  /** 0-1; nur gesendet, wenn gesetzt und > 0 */
  quality?: number;
  [key: string]: unknown;
}
/**
 * API Configuration
 * Pfad: /src/api/api.ts
 */

/**
 * Base URL der Backend-API, abhängig von der Umgebung.
 * VITE_API_BASE_URL hat Vorrang (Desktop-Build: .env.desktop), denn dort
 * liegt die App nicht auf kodinitools.com und ein relativer Pfad liefe ins Leere.
 */
export const getBaseURL = (env: ApiEnv = import.meta.env): string => {
  const override = env.VITE_API_BASE_URL;
  if (override) return override.replace(/\/+$/, '');
  if (env.PROD) {
    // Production: Verwendet den /bildkonverter Pfad
    return '/bildkonverter/api';
  }
  // Development: Verwendet localhost
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getBaseURL();

/**
 * fetch für API-Aufrufe. In der Desktop-App (Tauri) läuft die Anfrage über den
 * HTTP-Client der App (Rust) statt über den WebView: Der WebView würde die
 * Antwort der Live-API wegen CORS blockieren (Ursprung http://tauri.localhost).
 * Im Web-Build bleibt es das normale fetch; das Modul wird dort nie geladen.
 */
const apiFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  if (import.meta.env.MODE === 'desktop') {
    const { fetch: desktopFetch } = await import('@tauri-apps/plugin-http');
    return desktopFetch(url, init);
  }
  return fetch(url, init);
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS: Readonly<
  Record<'convertImage' | 'uploadImage' | 'getFormats', string>
> = {
  // Bildkonvertierung
  convertImage: `${API_BASE_URL}/convert-image`,

  // Weitere Endpoints (falls benötigt)
  uploadImage: `${API_BASE_URL}/upload`,
  getFormats: `${API_BASE_URL}/formats`,
};

/**
 * API Helper Functions
 */
export class ApiClient {
  /**
   * Konvertiert ein Bild über das Backend
   * @param imageBlob - Das Bild als Blob
   * @param format - Zielformat (tiff, heif, gif)
   * @param filename - Dateiname
   * @param options - Zusätzliche Optionen
   */
  static async convertImage(
    imageBlob: Blob,
    format: string,
    filename: string,
    options: ConvertImageOptions = {}
  ): Promise<Blob> {
    const formData = new FormData();
    // Preserve original filename so the backend can detect the format correctly
    const uploadName =
      imageBlob instanceof File && imageBlob.name ? imageBlob.name : filename || 'image.png';
    formData.append('image', imageBlob, uploadName);
    formData.append('format', format);
    formData.append('filename', filename);

    // Optionale Parameter
    if (options.quality) {
      formData.append('quality', String(options.quality));
    }

    try {
      const response = await apiFetch(API_ENDPOINTS.convertImage, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData: { message?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server-Fehler: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      logger.error('API-Fehler bei Bildkonvertierung:', error);
      throw error;
    }
  }

  /**
   * Prüft die Verfügbarkeit des Backends
   */
  static async checkBackendAvailability(): Promise<boolean> {
    try {
      const response = await apiFetch(API_ENDPOINTS.getFormats, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 Sekunden Timeout
      });
      return response.ok;
    } catch (error) {
      logger.warn('Backend nicht erreichbar:', error);
      return false;
    }
  }
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ApiClient,
};
