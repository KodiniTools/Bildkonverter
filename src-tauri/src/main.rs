// Kein Konsolenfenster neben der App (nur im Release-Build)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! Bildkonverter Pro als Desktop-App: ein Fenster mit der Web-App aus
//! dist-desktop/. Die Bildbearbeitung läuft wie im Browser komplett lokal
//! (Canvas, WebAssembly, ONNX-Modell liegt im Paket). Links nach außen
//! (z. B. kodinitools.com) öffnen im Standardbrowser statt im App-Fenster.

use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

/// Adressen, die zur App selbst gehören und im Fenster bleiben.
fn is_internal(url: &Url) -> bool {
    match url.scheme() {
        "tauri" | "blob" | "data" | "about" => true,
        "http" | "https" => {
            matches!(url.host_str(), Some("tauri.localhost"))
            // Entwicklung (`npm run tauri dev`): Vite-Dev-Server
            || (cfg!(debug_assertions) && matches!(url.host_str(), Some("localhost")))
        }
        _ => false,
    }
}

/// Externe Adresse im Standardbrowser öffnen (nur http/https/mailto).
fn open_external(app: &AppHandle, url: &Url) {
    if matches!(url.scheme(), "http" | "https" | "mailto") {
        if let Err(err) = app.opener().open_url(url.as_str(), None::<&str>) {
            eprintln!("Externer Link nicht geöffnet ({url}): {err}");
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // API-Aufrufe (TIFF, GIF, HEIC) ohne CORS-Sperre des WebView, siehe src/api/api.js
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let nav_handle = app.handle().clone();
            let popup_handle = app.handle().clone();
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Bildkonverter Pro")
                .inner_size(1280.0, 840.0)
                .min_inner_size(900.0, 600.0)
                .center()
                .on_navigation(move |url| {
                    if is_internal(url) {
                        return true;
                    }
                    open_external(&nav_handle, url);
                    false
                })
                // target="_blank" / window.open: kein zweites App-Fenster
                .on_new_window(move |url, _features| {
                    open_external(&popup_handle, &url);
                    NewWindowResponse::Deny
                })
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Bildkonverter konnte nicht gestartet werden");
}
