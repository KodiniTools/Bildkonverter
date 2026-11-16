# Deployment auf den VPS

Der Bildkonverter wird **auf dem Server aus dem Git-Repository gebaut** und nur das
fertige `dist/` ins Webroot kopiert. Quellcode und `node_modules` liegen dabei
außerhalb des öffentlich erreichbaren Verzeichnisses.

|                   |                                               |
| ----------------- | --------------------------------------------- |
| Zielverzeichnis   | `/var/www/kodinitools.com/bildkonverter`      |
| Öffentliche URL   | `https://kodinitools.com/bildkonverter/`      |
| Build-Verzeichnis | `/opt/bildkonverter` (Clone + `node_modules`) |
| Backups           | `/var/backups/bildkonverter/` (letzte 5)      |

Der Pfad `/bildkonverter/` ist in `vite.config.ts` als `base` fest verdrahtet und
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

### Sprachfassungen ohne JavaScript ausliefern (SEO)

Der Build schreibt für jede indexierbare Seite zwei fertige HTML-Dateien nach
`dist/_seo/<sprache>/<seite>.html`, z. B. `_seo/en/editor.html` oder
`_seo/de/konvertieren/png-zu-webp.html` (Quelle: `src/seo/pages.ts`, erzeugt von
`src/seo/prerender.ts`). Sie unterscheiden sich von `index.html` nur im `<head>`:
`<html lang>`, `<title>`, Description, Canonical, hreflang (de/en/x-default),
Open Graph und Twitter. So sehen Google und KI-Crawler unter `?lang=en` den
englischen Kopf, auch ohne JavaScript auszuführen.

Damit nginx diese Dateien ausliefert, zwei Ergänzungen:

**1. Im `http`-Block** (z. B. als `/etc/nginx/conf.d/bildkonverter-seo.conf`; `map`
ist im `server`-Block nicht erlaubt):

```nginx
# Sprache: ?lang=en -> en, alles andere -> de
map $arg_lang $bildkonverter_lang {
    default de;
    en      en;
}

# Seite: /bildkonverter/ -> index, /bildkonverter/editor -> editor,
#        /bildkonverter/konvertieren/png-zu-webp -> konvertieren/png-zu-webp
map $uri $bildkonverter_page {
    default                                           "";
    ~^/bildkonverter/?$                               index;
    ~^/bildkonverter/([a-z0-9-]+(?:/[a-z0-9-]+)?)/?$  $1;
}

# HTML nie cachen (verweist auf gehashte Assets), alles andere wie bisher
map $sent_http_content_type $bildkonverter_expires {
    default      off;
    ~text/html   epoch;
}
```

**2. Im `server`-Block** den bisherigen `location /bildkonverter/` ersetzen und
einen Block für `_seo` ergänzen:

```nginx
    location /bildkonverter/ {
        # 1. echte Datei, 2. vorgerenderte Seite in der Sprache, 3. SPA-Fallback
        try_files $uri /bildkonverter/_seo/$bildkonverter_lang/$bildkonverter_page.html /bildkonverter/index.html;
        expires $bildkonverter_expires;
    }

    # Die vorgerenderten Dateien nur über die echten URLs ausliefern, nicht direkt
    location /bildkonverter/_seo/ {
        internal;
    }
```

Hinweise:

- `$uri/` fällt aus dem `try_files` weg, sonst würde `/bildkonverter/` weiter die
  allgemeine `index.html` liefern statt `_seo/<sprache>/index.html`.
- Unbekannte Pfade (`/bildkonverter/xyz`, ungültige `/konvertieren/...`) finden keine
  Datei in `_seo` und landen wie bisher bei `index.html`.
- Die Navigation, Footer und Cookie-Banner kommen per SSI (`<!--#include ... -->`).
  `ssi on;` muss deshalb auch für `location /bildkonverter/` gelten. Steht es auf
  `server`-Ebene, ist nichts zu tun.
- Den Block `location /bildkonverter/assets/` und das `no-cache` für
  `location = /bildkonverter/index.html` unverändert lassen.
- `deploy.sh` braucht keine Änderung: `rsync` kopiert `_seo/` mit.

Prüfen und übernehmen, danach kontrollieren:

```bash
sudo nginx -t && sudo systemctl reload nginx

curl -s 'https://kodinitools.com/bildkonverter/editor?lang=en' | grep -E '<html|<title>|canonical'
# <html lang="en">
# <title>Image Editor - Image Converter Pro | KodiniTools</title>
# <link rel="canonical" href="https://kodinitools.com/bildkonverter/editor?lang=en" />

curl -s 'https://kodinitools.com/bildkonverter/editor' | grep -E '<html|<title>'
# <html lang="de">  /  <title>Bild-Editor - Bildkonverter Pro | KodiniTools</title>

curl -sI 'https://kodinitools.com/bildkonverter/editor?lang=en' | grep -i cache-control
# Cache-Control: no-cache

curl -sI https://kodinitools.com/bildkonverter/_seo/en/editor.html | head -1
# HTTP/2 404
```

Ohne diese nginx-Ergänzung läuft die App unverändert weiter (die `_seo`-Dateien
liegen dann nur ungenutzt im Webroot).

### Icons

Die App bringt ihre Icons selbst mit (Lucide über `src/components/ui/AppIcon.vue`,
im Bundle). Font Awesome vom Domain-Root (`/fontawesome/css/…`) wird nicht mehr
eingebunden.

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

curl -I https://kodinitools.com/bildkonverter/      # 200
curl -I https://kodinitools.com/bildkonverter/editor # 200 (SPA-Fallback greift)
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

`deploy-to-server.ps1` stammt aus dem Schwesterprojekt _bilderseriebearbeiten_
und nennt den base-Pfad `/bilderseriebearbeiten/`. Für das Deployment ist die
Datei ohne Bedeutung. Die ebenfalls von dort stammende Vite-Konfiguration wurde
ersetzt (maßgeblich ist `vite.config.ts` mit `/bildkonverter/`), das Prüfskript
`deploy-check` wurde gelöscht.
