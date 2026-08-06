# Deployment auf den VPS

Der Bildkonverter wird **auf dem Server aus dem Git-Repository gebaut** und nur das
fertige `dist/` ins Webroot kopiert. Quellcode und `node_modules` liegen dabei
außerhalb des öffentlich erreichbaren Verzeichnisses.

| | |
|---|---|
| Zielverzeichnis | `/var/www/kodinitools.com/bildkonverter` |
| Öffentliche URL | `https://www.kodinitools.com/bildkonverter/` |
| Build-Verzeichnis | `/opt/bildkonverter` (Clone + `node_modules`) |
| Backups | `/var/backups/bildkonverter/` (letzte 5) |

Der Pfad `/bildkonverter/` ist in `vite.config.js` als `base` fest verdrahtet und
muss zum Ordnernamen im Webroot passen – sonst laden die Assets nicht.

---

## 1. Einmalige Einrichtung

### Voraussetzungen

```bash
node -v          # 18 oder neuer erforderlich
npm -v
which git rsync  # beide werden benötigt
```

Falls Node fehlt oder zu alt ist:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git rsync
```

### Repository klonen

```bash
sudo mkdir -p /opt/bildkonverter
sudo chown "$USER" /opt/bildkonverter
git clone https://github.com/KodiniTools/Bildkonverter.git /opt/bildkonverter
```

### nginx konfigurieren

Die App nutzt den Vue-Router im History-Modus. Ohne Fallback liefert ein direkter
Aufruf von `/bildkonverter/editor` einen 404 – nur `/bildkonverter/` selbst würde
funktionieren. Im `server`-Block der Domain ergänzen:

```nginx
server {
    server_name www.kodinitools.com kodinitools.com;
    root /var/www/kodinitools.com;

    # SPA-Fallback: unbekannte Unterpfade an die index.html der App geben
    location /bildkonverter/ {
        try_files $uri $uri/ /bildkonverter/index.html;
    }

    # Assets tragen einen Hash im Namen -> dauerhaft cachebar
    location /bildkonverter/assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html niemals cachen, sonst zeigt der Browser nach einem
    # Deployment weiter auf die alten Asset-Hashes
    location = /bildkonverter/index.html {
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
```

nginx wählt immer den längsten passenden Prefix, die Reihenfolge der Blöcke im
File spielt also keine Rolle.

Falls das Backend für TIFF/HEIF-Konvertierung läuft (siehe `src/api/api.js`,
Endpunkt `/bildkonverter/api`), zusätzlich:

```nginx
    location /bildkonverter/api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
```

Danach prüfen und übernehmen:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Font Awesome prüfen

`index.html` bindet die Icons **absolut vom Domain-Root** ein
(`/fontawesome/css/…`), nicht aus dem App-Ordner. Diese Dateien liegen nicht im
Repository und werden vom Deployment nicht angefasst:

```bash
ls /var/www/kodinitools.com/fontawesome/css/
# fontawesome.min.css und solid.min.css müssen vorhanden sein
```

Fehlen sie, bleiben in der ganzen App die Icons unsichtbar – die Funktion selbst
ist davon nicht betroffen.

---

## 2. Deployment ausführen

```bash
cd /opt/bildkonverter
git pull                       # holt auch Änderungen an deploy.sh selbst
sudo ./deploy.sh
```

Das Skript erledigt nacheinander:

1. Voraussetzungen prüfen (Node ≥ 18, git, rsync, plausibles Zielverzeichnis)
2. `git fetch` + harter Reset auf `origin/main`
3. `npm ci` und `npm run build`
4. Build verifizieren (`dist/index.html`, `dist/assets`, passender base-Pfad)
5. Bestehenden Stand als `.tar.gz` sichern
6. Vor dem Löschen anzeigen, **was** im Ziel gelöscht wird, und nachfragen
7. Per `rsync --delete` veröffentlichen
8. Rechte setzen (`www-data`, Ordner 755, Dateien 644) und nginx neu laden

Nützliche Optionen:

```bash
sudo ./deploy.sh --dry-run     # zeigt alle Änderungen, verändert nichts
sudo ./deploy.sh --yes         # ohne Rückfrage (Cronjob / CI)
sudo ./deploy.sh --branch dev  # anderen Branch ausliefern
```

Konfiguration überschreiben, ohne das Skript zu ändern:

```bash
sudo TARGET_DIR=/var/www/staging/bildkonverter ./deploy.sh
sudo RSYNC_EXCLUDES="api/ uploads/" ./deploy.sh
```

`RSYNC_EXCLUDES` schützt Pfade im Zielverzeichnis vor dem Löschen durch
`--delete`. Voreingestellt ist `api/`.

---

## 3. Kontrolle nach dem Deployment

```bash
cat /var/www/kodinitools.com/bildkonverter/.deployed    # Commit, Branch, Zeitpunkt

curl -I https://www.kodinitools.com/bildkonverter/      # 200
curl -I https://www.kodinitools.com/bildkonverter/editor # 200 (SPA-Fallback greift)
```

Im Browser mit `Strg`+`F5` neu laden. Erscheinen weiterhin alte Inhalte, liefert
in der Regel ein Cache die alte `index.html` – siehe den `no-cache`-Block oben.

---

## 4. Rollback

```bash
ls -1t /var/backups/bildkonverter/
sudo tar -xzf /var/backups/bildkonverter/bildkonverter_JJJJMMTT_HHMMSS.tar.gz \
     -C /var/www/kodinitools.com/bildkonverter
sudo chown -R www-data:www-data /var/www/kodinitools.com/bildkonverter
```

Alternativ einen früheren Commit ausliefern:

```bash
cd /opt/bildkonverter && git checkout <commit> && sudo ./deploy.sh
```

---

## Hinweis zu Altlasten im Repository

`vite.config.ts`, `deploy-check.js` und `deploy-to-server.ps1` stammen aus dem
Schwesterprojekt *bilderseriebearbeiten* und nennen den base-Pfad
`/bilderseriebearbeiten/`. Maßgeblich ist `vite.config.js` – Vite bevorzugt die
`.js`-Variante, der Build verwendet also korrekt `/bildkonverter/`. Für das
Deployment sind die drei Dateien ohne Bedeutung; `deploy-check.js` würde bei
einem Aufruf allerdings irreführende Fehler melden.
