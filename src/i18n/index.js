import { createI18n } from 'vue-i18n'

/**
 * Deutsche Übersetzungen
 */
const de = {
  app: {
    title: 'Bildkonverter Pro',
    subtitle: 'Schnelle und sichere Bildbearbeitung im Browser',
    version: 'Version',
    changeLanguage: 'Sprache ändern',
    changeTheme: 'Theme ändern'
  },
  nav: {
    home: 'Startseite',
    editor: 'Editor',
    gallery: 'Galerie',
    guide: 'Anleitung',
    about: 'Über uns',
    upload: 'Bild hochladen',
    edit: 'Bearbeiten',
    filters: 'Filter',
    text: 'Text',
    export: 'Exportieren',
    history: 'Verlauf',
    settings: 'Einstellungen'
  },
  locale: 'de-DE',
  home: {
    title: 'Willkommen beim Bildkonverter Pro',
    subtitle: 'Schnelle und sichere Bildbearbeitung meist lokal im Browser, Spezialformate sicher auf dem deutschen Server',
    startEditing: 'Bearbeitung starten',
    heroAlt: 'Bildkonverter Pro - Online-Bildbearbeitung und Formatkonvertierung',
    features: {
      title: 'Funktionen',
      convert: {
        title: 'Format-Konvertierung',
        description: 'Konvertiere Bilder zwischen JPG, PNG, WebP, GIF und mehr'
      },
      edit: {
        title: 'Bildbearbeitung',
        description: 'Filter, Anpassungen und Effekte in Echtzeit'
      },
      compress: {
        title: 'Komprimierung',
        description: 'Reduziere Dateigröße ohne Qualitätsverlust'
      },
      privacy: {
        title: 'Datenschutz',
        description: 'Konvertierung lokal im Browser (mit notwendigen Server-Ausnahmen)'
      },
      fast: {
        title: 'Schnell',
        description: 'Sofortige Verarbeitung ohne Upload'
      },
      crop: {
        title: 'Bilder zuschneiden',
        description: 'Schneiden Sie Ihre Bilder präzise zu und fokussieren Sie auf das Wesentliche. Perfekt für Social Media und Webseiten.'
      }
    },
    faq: {
      title: 'Häufig gestellte Fragen',
      subtitle: 'Alles, was Sie über unseren Bildeditor wissen müssen',
      items: {
        formats: {
          question: 'Welche Bildformate werden unterstützt?',
          answer: 'Unser Editor unterstützt PNG, JPEG, WEBP, TIFF, GIF, HAIF und PDF Formate. Sie können Bilder hochladen und in jedes dieser Formate konvertieren.'
        },
        privacy: {
          question: 'Sind meine Bilder sicher und privat?',
          answer: 'Ja, absolut. Der Schutz Ihrer Daten hat für uns höchste Priorität. Um transparent zu sein, hängt der genaue Prozess vom gewählten Dateiformat ab:\n\n' +
            'Für die meisten Formate: Wenn Sie gängige Formate wie JPG, PNG, WEBP und PDF konvertieren, findet die gesamte Verarbeitung zu 100% lokal in Ihrem Webbrowser statt. Ihre Bilder verlassen Ihr Gerät zu keinem Zeitpunkt. Dies ist die schnellste und privateste Methode, die wir für die Mehrheit unserer Formate anbieten.\n\n' +
            'Für Spezialformate: Für komplexe Formate wie TIFF, GIF und HAIC ist eine serverseitige Verarbeitung auf unseren Servern nötig, da Browser diese Umwandlung (noch) nicht lokal durchführen können.\n\n' +
            'Unser Datenschutz-Versprechen für diese Server-Verarbeitung:\n' +
            '1. Sicherer Upload: Ihre Datei wird SSL-verschlüsselt auf unseren Server übertragen.\n' +
            '2. Standort Deutschland: Unser Server steht in Deutschland und arbeitet streng nach DSGVO-Richtlinien.\n' +
            '3. Keine Speicherung: Ihre Datei wird ausschließlich für den automatisierten Konvertierungsprozess genutzt und unmittelbar (spätestens innerhalb von 15 Minuten) nach der erfolgreichen Konvertierung dauerhaft gelöscht.\n' +
            '4. Keine Einsicht: Weder das Original noch die konvertierte Datei wird von uns gespeichert, analysiert oder eingesehen.'
        },
        filters: {
          question: 'Welche Filter und Anpassungen kann ich vornehmen?',
          answer: 'Sie können Helligkeit, Kontrast, Sättigung, Unschärfe und Farbton anpassen. Zusätzlich bieten wir vorgefertigte Presets wie Grayscale, Sepia, Vintage und mehr für schnelle Stiländerungen.'
        },
        crop: {
          question: 'Kann ich Bilder zuschneiden und in der Größe ändern?',
          answer: 'Ja, Sie können Bilder präzise zuschneiden und die Größe anpassen. Mit der Crop-Funktion wählen Sie den gewünschten Bereich aus, und mit den Resize-Optionen ändern Sie Breite und Höhe bei Beibehaltung des Seitenverhältnisses.'
        },
        resize: {
          question: 'Kann ich Bilder drehen und spiegeln?',
          answer: 'Selbstverständlich! Sie können Bilder um 90° oder 180° drehen, horizontal oder vertikal spiegeln und sogar benutzerdefinierte Rotationen mit präziser Gradeingabe durchführen.'
        },
        download: {
          question: 'Wie speichere ich mein bearbeitetes Bild?',
          answer: 'Klicken Sie einfach auf den Download-Button in der Toolbar. Sie können das Bildformat wählen und das bearbeitete Bild wird direkt auf Ihr Gerät heruntergeladen. Kein Account erforderlich!'
        }
      }
    },
    conversions: {
      title: 'Beliebte Konvertierungen',
      subtitle: 'Wählen Sie Ihr gewünschtes Format – schnell, kostenlos und direkt im Browser'
    },
    webpPromo: {
      title: 'Warum WebP? Verbessere dein Google PageSpeed Ranking!',
      description: 'WebP bietet bis zu 30% kleinere Dateien als PNG und JPG bei gleicher Qualität. Google empfiehlt WebP für schnellere Ladezeiten – ein direkter Ranking-Faktor für SEO.',
      cta: 'Jetzt zu WebP konvertieren'
    }
  },
  conversion: {
    batchCta: 'Mehrere Bilder konvertieren',
    widget: {
      dropHint: 'Datei hierher ziehen oder klicken zum Auswählen',
      converting: 'Wird konvertiert...',
      download: 'Herunterladen',
      convertAnother: 'Weiteres Bild konvertieren',
      tryAgain: 'Erneut versuchen'
    },
    benefits: {
      fast: {
        title: 'Blitzschnell',
        description: 'Konvertierung in Sekunden, direkt in Ihrem Browser.'
      },
      privacy: {
        title: 'DSGVO-konform',
        description: 'Ihre Bilder werden lokal verarbeitet. Kein Upload nötig.'
      },
      quality: {
        title: 'Beste Qualität',
        description: 'Wählen Sie die Qualitätsstufe – von maximaler Kompression bis verlustfrei.'
      }
    },
    howTo: {
      title: 'So funktioniert es',
      step1: {
        title: 'Bild hochladen',
        description: 'Ziehen Sie Ihr Bild in den Editor oder klicken Sie auf den Upload-Button.'
      },
      step2: {
        title: 'Format wählen',
        description: 'Wählen Sie das gewünschte Zielformat und die Qualitätsstufe.'
      },
      step3: {
        title: 'Herunterladen',
        description: 'Klicken Sie auf Download und Ihr konvertiertes Bild wird sofort gespeichert.'
      }
    },
    otherFormats: {
      title: 'Weitere Konvertierungen'
    },
    formats: {
      heic: { info: 'Apple-Format für iPhone-Fotos. Hohe Qualität bei geringer Dateigröße, aber eingeschränkte Kompatibilität.' },
      jpg: { info: 'Das universellste Bildformat. Ideal für Fotos und Web-Inhalte mit einstellbarer Kompression.' },
      png: { info: 'Verlustfreies Format mit Transparenz-Unterstützung. Perfekt für Grafiken, Logos und Screenshots.' },
      webp: { info: 'Modernes Google-Format. Bis zu 30% kleiner als JPG/PNG bei gleicher Qualität – ideal für Web-Performance.' },
      tiff: { info: 'Professionelles Druckformat. Verlustfrei mit hoher Farbtiefe – Standard in der Druckindustrie.' },
      gif: { info: 'Unterstützt Animationen und einfache Grafiken mit bis zu 256 Farben.' },
      bmp: { info: 'Unkomprimiertes Windows-Bitmap-Format. Hohe Qualität, aber große Dateigröße.' },
      svg: { info: 'Vektorbasiertes Format. Unendlich skalierbar ohne Qualitätsverlust – ideal für Logos und Icons.' },
      pdf: { info: 'Universelles Dokumentenformat. Ideal für den Druck, Archivierung und den Austausch von Bildern als Dokument.' }
    },
    'heic-zu-jpg': {
      title: 'HEIC in JPG umwandeln – Schnell & Kostenlos',
      description: 'iPhone-Fotos im HEIC-Format einfach und kostenlos in JPG konvertieren. Direkt im Browser, ohne Upload auf externe Server.',
      cta: 'HEIC jetzt in JPG konvertieren',
      whyTitle: 'Warum HEIC in JPG umwandeln?',
      advantage: 'JPG ist das universellste Bildformat und wird von allen Geräten, Browsern und Programmen unterstützt. HEIC-Dateien von iPhones sind oft nicht direkt kompatibel – die Konvertierung zu JPG löst dieses Problem sofort.'
    },
    'png-zu-webp': {
      title: 'PNG in WebP umwandeln – Für schnellere Websites',
      description: 'PNG-Dateien kostenlos in das moderne WebP-Format konvertieren. Bis zu 30% kleinere Dateien bei gleicher Qualität – perfekt für Web-Performance und SEO.',
      cta: 'PNG jetzt in WebP konvertieren',
      whyTitle: 'Warum PNG zu WebP konvertieren?',
      advantage: 'WebP bietet deutlich kleinere Dateigrößen als PNG bei vergleichbarer Qualität und unterstützt ebenfalls Transparenz. Google empfiehlt WebP für schnellere Ladezeiten, was direkt das PageSpeed-Ranking verbessert.'
    },
    'jpg-zu-webp': {
      title: 'JPG in WebP umwandeln – Web-Optimierung',
      description: 'JPG-Bilder kostenlos in WebP konvertieren. Modernste Kompression für schnellere Ladezeiten und besseres Google PageSpeed Ranking.',
      cta: 'JPG jetzt in WebP konvertieren',
      whyTitle: 'Warum JPG zu WebP konvertieren?',
      advantage: 'WebP komprimiert Bilder effizienter als JPG und wird von allen modernen Browsern unterstützt. Durch den Wechsel zu WebP verbessern Sie die Ladezeit Ihrer Website – ein wichtiger Ranking-Faktor bei Google.'
    },
    'webp-zu-png': {
      title: 'WebP in PNG umwandeln – Für maximale Kompatibilität',
      description: 'WebP-Dateien kostenlos in PNG konvertieren. Verlustfreie Qualität mit universeller Kompatibilität.',
      cta: 'WebP jetzt in PNG konvertieren',
      whyTitle: 'Warum WebP zu PNG konvertieren?',
      advantage: 'PNG bietet maximale Kompatibilität mit allen Bildbearbeitungsprogrammen und älteren Systemen. Wenn Sie ein WebP-Bild für den Druck oder in Programmen verwenden möchten, die WebP nicht unterstützen, ist PNG die beste Wahl.'
    },
    'jpg-zu-png': {
      title: 'JPG in PNG umwandeln – Für Transparenz und Qualität',
      description: 'JPG-Bilder kostenlos und verlustfrei in PNG konvertieren. Ideal wenn Sie Transparenz benötigen oder Qualitätsverluste vermeiden möchten.',
      cta: 'JPG jetzt in PNG konvertieren',
      whyTitle: 'Warum JPG zu PNG konvertieren?',
      advantage: 'PNG unterstützt Transparenz und verlustfreie Kompression. Ideal wenn Sie Bilder weiterbearbeiten, Hintergründe entfernen oder Grafiken mit scharfen Kanten erstellen möchten.'
    },
    'png-zu-jpg': {
      title: 'PNG in JPG umwandeln – Dateigröße reduzieren',
      description: 'PNG-Dateien kostenlos in JPG konvertieren. Reduzieren Sie die Dateigröße deutlich – ideal für den E-Mail-Versand und Social Media.',
      cta: 'PNG jetzt in JPG konvertieren',
      whyTitle: 'Warum PNG zu JPG konvertieren?',
      advantage: 'JPG-Dateien sind deutlich kleiner als PNGs. Wenn Sie keine Transparenz benötigen, sparen Sie mit JPG erheblich Speicherplatz – ideal für Fotos, E-Mail-Anhänge und Social-Media-Posts.'
    },
    'tiff-zu-jpg': {
      title: 'TIFF in JPG umwandeln – Für Web und E-Mail',
      description: 'Große TIFF-Dateien kostenlos in kompakte JPG-Bilder konvertieren. Perfekt für den Web-Upload und E-Mail-Versand.',
      cta: 'TIFF jetzt in JPG konvertieren',
      whyTitle: 'Warum TIFF zu JPG konvertieren?',
      advantage: 'TIFF-Dateien sind für den Druck optimiert und oft sehr groß. JPG reduziert die Dateigröße massiv und ermöglicht das einfache Teilen per Web, E-Mail oder Social Media.'
    },
    'bmp-zu-webp': {
      title: 'BMP in WebP umwandeln – Massive Kompression',
      description: 'Unkomprimierte BMP-Dateien in das moderne WebP-Format konvertieren. Drastische Größenreduktion bei hervorragender Qualität.',
      cta: 'BMP jetzt in WebP konvertieren',
      whyTitle: 'Warum BMP zu WebP konvertieren?',
      advantage: 'BMP-Dateien sind unkomprimiert und extrem groß. WebP bietet modernste Kompression und reduziert die Dateigröße um bis zu 95% – ideal um alte BMP-Bestände webfähig zu machen.'
    },
    'gif-zu-webp': {
      title: 'GIF in WebP umwandeln – Kleiner und schärfer',
      description: 'GIF-Dateien kostenlos in WebP konvertieren. Kleinere Dateigröße mit besserer Farbtiefe als GIF.',
      cta: 'GIF jetzt in WebP konvertieren',
      whyTitle: 'Warum GIF zu WebP konvertieren?',
      advantage: 'WebP unterstützt mehr als 256 Farben (im Gegensatz zu GIF) und bietet bessere Kompression. Ihre Bilder sehen schärfer aus und laden schneller – ein Gewinn für jede Website.'
    },
    'heic-zu-png': {
      title: 'HEIC in PNG umwandeln – Verlustfrei konvertieren',
      description: 'iPhone HEIC-Fotos kostenlos in das verlustfreie PNG-Format konvertieren. Maximale Qualität mit Transparenz-Unterstützung.',
      cta: 'HEIC jetzt in PNG konvertieren',
      whyTitle: 'Warum HEIC zu PNG konvertieren?',
      advantage: 'PNG bietet verlustfreie Qualität und Transparenz. Ideal wenn Sie iPhone-Fotos weiterbearbeiten oder in der höchsten Qualität archivieren möchten.'
    },
    'webp-zu-jpg': {
      title: 'WebP in JPG umwandeln – Universelle Kompatibilität',
      description: 'WebP-Bilder kostenlos in das universelle JPG-Format konvertieren. Für maximale Kompatibilität mit allen Geräten.',
      cta: 'WebP jetzt in JPG konvertieren',
      whyTitle: 'Warum WebP zu JPG konvertieren?',
      advantage: 'JPG wird von jedem Gerät und Programm unterstützt. Wenn Sie WebP-Bilder in älteren Programmen, per E-Mail oder für den Druck verwenden möchten, ist JPG die sicherste Wahl.'
    },
    'svg-zu-png': {
      title: 'SVG in PNG umwandeln – Vektor zu Pixel',
      description: 'SVG-Vektorgrafiken kostenlos in PNG-Pixelbilder konvertieren. Ideal für Social Media, Präsentationen und Druck.',
      cta: 'SVG jetzt in PNG konvertieren',
      whyTitle: 'Warum SVG zu PNG konvertieren?',
      advantage: 'SVG ist ein Vektorformat, das nicht überall angezeigt werden kann. PNG ist universell kompatibel und ideal wenn Sie eine SVG-Grafik in fester Größe für Social Media, Präsentationen oder den Druck benötigen.'
    },
    'jpg-zu-pdf': {
      title: 'JPG in PDF umwandeln – Bilder als Dokument',
      description: 'JPG-Bilder kostenlos in PDF-Dokumente konvertieren. Perfekt für den Druck, Bewerbungen, Archivierung und den professionellen Versand.',
      cta: 'JPG jetzt in PDF konvertieren',
      whyTitle: 'Warum JPG zu PDF konvertieren?',
      advantage: 'PDF ist das universelle Dokumentenformat und wird auf jedem Gerät identisch angezeigt. Ideal um Fotos professionell zu versenden, zu drucken oder zu archivieren – mit garantierter Darstellung auf allen Plattformen.'
    },
    'png-zu-svg': {
      title: 'PNG in SVG umwandeln – Bild in Vektorformat',
      description: 'PNG-Bilder kostenlos in das SVG-Format konvertieren. Erzeugt eine SVG-Datei mit eingebettetem Rasterbild – kompatibel mit allen Vektorgrafik-Programmen.',
      cta: 'PNG jetzt in SVG konvertieren',
      whyTitle: 'Warum PNG zu SVG konvertieren?',
      advantage: 'SVG ist das Standardformat für Webgrafiken und wird von allen modernen Browsern und Designprogrammen unterstützt. Durch die Konvertierung erhalten Sie eine SVG-Datei, die Sie in Illustrator, Figma oder als Webgrafik einsetzen können.'
    }
  },
  editor: {
    toolbar: {
      upload: 'Hochladen',
      reset: 'Zurücksetzen',
      clearImage: 'Bild löschen',
      preview: 'Vorschau',
      download: 'Download',
      undo: 'Rückgängig',
      redo: 'Wiederholen'
    },
    sidebar: {
      format: 'Format',
      background: 'Hintergrund',
      adjustments: 'Anpassungen',
      lightColor: 'Licht & Farbe',
      effects: 'Effekte',
      presets: 'Presets',
      resize: 'Größe ändern'
    },
    background: {
      color: 'Farbe',
      opacity: 'Deckkraft',
      hint: 'Bild laden um Hintergrund anzupassen'
    },
    filters: {
      brightness: 'Helligkeit',
      contrast: 'Kontrast',
      saturation: 'Sättigung',
      blur: 'Weichzeichner',
      hue: 'Farbton',
      exposure: 'Belichtung',
      highlights: 'Lichter',
      shadows: 'Schatten',
      sepia: 'Wärme',
      grayscale: 'Graustufen',
      invert: 'Invertieren',
      vignette: 'Vignette',
      sharpness: 'Schärfe'
    },
    presets: {
      normal: 'Normal',
      vintage: 'Vintage',
      bw: 'Schwarz/Weiß',
      vivid: 'Lebendig',
      cold: 'Kalt',
      warm: 'Warm'
    },
    resize: {
      width: 'Breite',
      height: 'Höhe',
      maintainAspect: 'Seitenverhältnis beibehalten',
      apply: 'Anwenden',
      presets: 'Presets',
      selectPreset: 'Preset wählen...'
    },
    canvas: {
      empty: {
        title: 'Kein Bild geladen',
        description: 'Lade ein Bild hoch um zu beginnen',
        button: 'Bild hochladen'
      }
    },
    export: {
      quality: 'Qualität',
      transparentBackground: 'Transparenter Hintergrund'
    }
  },
  transform: {
    crop: {
      title: 'Zuschneiden',
      button: 'Zuschneiden',
      confirm: 'Bestätigen',
      undo: 'Rückgängig',
      aspectRatio: 'Seitenverhältnis',
      presets: {
        free: 'Frei',
        circle: 'Kreis'
      }
    },
    title: 'Transformationen',
    opacity: 'Deckkraft',
    rotation: 'Rotation',
    rotationTooltip: {
      counterClockwise: '90° gegen Uhrzeigersinn',
      rotate180: '180° drehen',
      clockwise: '90° im Uhrzeigersinn'
    },
    flip: {
      horizontal: 'Horizontal',
      vertical: 'Vertikal',
      horizontalTooltip: 'Horizontal spiegeln',
      verticalTooltip: 'Vertikal spiegeln'
    },
    zoom: 'Zoom',
    panHint: 'Leertaste + Ziehen oder Mausrad-Klick zum Verschieben',
    resetPan: 'Ansicht zentrieren',
    borderRadius: 'Ecken abrunden',
    borderRadiusHint: '50% = vollständiger Kreis',
    border: 'Rahmen',
    borderColor: 'Farbe',
    shadow: {
      title: 'Schlagschatten',
      offsetX: 'X-Versatz',
      offsetY: 'Y-Versatz',
      blur: 'Weichzeichner',
      opacity: 'Deckkraft',
      color: 'Farbe'
    },
    skew: {
      title: 'Neigung',
      horizontal: 'Horizontal',
      vertical: 'Vertikal'
    },
    apply: 'Anwenden',
    applyTooltip: 'Transformationen permanent anwenden',
    reset: 'Zurücksetzen'
  },
  textModal: {
    addTitle: 'Text hinzufügen',
    editTitle: 'Text bearbeiten',
    text: 'Text',
    textPlaceholder: 'Geben Sie Ihren Text ein...',
    fontSize: 'Schriftgröße',
    color: 'Farbe',
    fontFamily: 'Schriftart',
    add: 'Hinzufügen',
    update: 'Aktualisieren',
    delete: 'Löschen',
    cancel: 'Abbrechen',
    undo: 'Rückgängig',
    redo: 'Wiederherstellen'
  },
  textPanel: {
    title: 'Text bearbeiten',
    content: 'Text',
    placeholder: 'Text eingeben...',
    fontSize: 'Schriftgröße',
    fontFamily: 'Schriftart',
    customFonts: 'Benutzerdefinierte Schriften',
    systemFonts: 'System-Schriften',
    color: 'Farbe',
    rotation: 'Rotation',
    opacity: 'Deckkraft',
    strokeWidth: 'Umrandung',
    strokeColor: 'Umrandungsfarbe',
    shadow: 'Schatten',
    shadowColor: 'Schattenfarbe',
    undo: 'Rückgängig',
    redo: 'Wiederherstellen',
    delete: 'Text löschen',
    deselect: 'Auswahl aufheben',
    selectHint: 'Klicken Sie auf einen Text im Bild, um ihn zu bearbeiten'
  },
  gallery: {
    title: 'Galerie',
    subtitle: 'Verwalten Sie Ihre Bilder',
    search: 'Bilder durchsuchen...',
    filters: {
      all: 'Alle',
      recent: 'Neueste',
      edited: 'Bearbeitet',
      favorites: 'Favoriten'
    },
    gridView: 'Rasteransicht',
    listView: 'Listenansicht',
    buttons: {
      upload: 'Bilder hochladen',
      deleteAll: 'Alle Bilder löschen',
      addToEditor: 'Zum Editor hinzufügen',
      delete: 'Löschen',
      preview: 'Vorschau',
      download: 'Herunterladen',
      openInEditor: 'Im Editor öffnen',
      selectMultiple: 'Mehrfachauswahl',
      cancelSelection: 'Abbrechen',
      selectAll: 'Alle auswählen',
      deselectAll: 'Alle abwählen',
      createCollage: 'Collage erstellen'
    },
    errors: {
      minTwoImages: 'Bitte wählen Sie mindestens 2 Bilder aus',
      collageError: 'Fehler beim Erstellen der Collage'
    },
    empty: {
      title: 'Keine Bilder in der Galerie',
      description: 'Nutzen Sie den "Bilder hochladen" Button oben um Ihre ersten Bilder hinzuzufügen',
      button: 'Bilder hochladen'
    },
    imageCount: {
      single: 'Bild',
      plural: 'Bilder'
    },
    info: {
      name: 'Name',
      size: 'Größe',
      dimensions: 'Abmessungen',
      uploaded: 'Hochgeladen',
      format: 'Format'
    },
    actions: {
      select: 'Auswählen',
      deselect: 'Abwählen',
      selectAll: 'Alle auswählen',
      deselectAll: 'Alle abwählen'
    },
    files: {
      download: 'Herunterladen',
      preview: 'Vorschau'
    },
    preview: {
      title: 'Bildvorschau',
      original: 'Original',
      processed: 'Bearbeitet',
      close: 'Schließen'
    },
    confirmDelete: 'Möchten Sie "{name}" wirklich löschen?',
    confirmDeleteAll: '⚠️ ACHTUNG: Möchten Sie wirklich ALLE {count} {images} aus der Galerie löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!',
    deleteSuccess: '{count} {images} gelöscht',
    uploadSuccess: '{count} {images} erfolgreich hochgeladen',
    uploadError: 'Fehler beim Hochladen von {name}',
    noSelection: 'Kein Bild ausgewählt',
    tooltips: {
      upload: 'Neue Bilder zur Galerie hinzufügen',
      deleteAll: 'Alle Bilder aus der Galerie löschen',
      preview: 'Bildvorschau anzeigen',
      addToEditor: 'Ausgewähltes Bild im Editor öffnen',
      delete: 'Ausgewähltes Bild löschen'
    }
  },
  about: {
    title: 'Über Bildkonverter Pro',
    subtitle: 'Schnelle und sichere Bildbearbeitung',
    mission: {
      title: 'Unsere Mission',
      description: 'Bildbearbeitung für jeden einfach und zugänglich zu machen'
    },
    privacy: {
      title: 'Datenschutz',
      description: 'Konvertierung lokal im Browser (mit notwendigen Server-Ausnahmen)'
    },
    technology: {
      title: 'Technologie',
      description: 'Moderne Web-Technologien für beste Performance'
    },
    features: {
      title: 'Funktionen',
      offline: {
        title: 'Offline-Nutzung',
        description: 'Funktioniert komplett offline'
      },
      formats: {
        title: 'Unterstützte Formate',
        description: 'PNG, JPEG, WEBP, TIFF, GIF, HAIF und PDF'
      },
      quality: {
        title: 'Hohe Qualität',
        description: 'Verlustfreie Bearbeitung möglich'
      },
      editor: {
        title: 'Vollständiger Editor',
        description: 'Filter, Anpassungen und mehr'
      },
      free: {
        title: 'Kostenlos',
        description: 'Komplett kostenlos nutzbar'
      }
    },
    techStack: {
      title: 'Technologie-Stack',
      vue: 'Modernes Vue.js Framework',
      i18n: 'Mehrsprachige Unterstützung',
      pinia: 'State Management',
      vite: 'Schnelles Build-Tool',
      scss: 'Modernes Styling',
      canvas: 'Bildverarbeitung'
    },
    version: {
      title: 'Version',
      releaseDate: 'Veröffentlicht am'
    },
    links: {
      github: 'GitHub',
      documentation: 'Dokumentation'
    },
    contact: {
      title: 'Kontakt',
      description: 'Hast du Fragen oder Feedback?'
    }
  },
  guide: {
    title: 'Benutzeranleitung',
    subtitle: 'Lernen Sie alle Funktionen des Bildkonverters kennen',
    quickStart: {
      title: 'Schnellstart',
      step1: {
        title: 'Bild hochladen',
        description: 'Ziehen Sie ein Bild in den Editor oder klicken Sie auf "Bild hochladen", um eine Datei auszuwählen.'
      },
      step2: {
        title: 'Bild bearbeiten',
        description: 'Nutzen Sie Filter, Anpassungen und Transformationen, um Ihr Bild nach Ihren Wünschen zu gestalten.'
      },
      step3: {
        title: 'Speichern & Herunterladen',
        description: 'Wählen Sie Ihr gewünschtes Format und laden Sie das fertige Bild herunter.'
      }
    },
    upload: {
      title: 'Bilder hochladen',
      description: 'Es gibt mehrere Wege, ein Bild in den Editor zu laden:',
      methods: {
        dragDrop: 'Ziehen Sie ein Bild direkt in den Editor (Drag & Drop)',
        fileSelect: 'Klicken Sie auf "Bild hochladen" und wählen Sie eine Datei aus',
        url: 'Laden Sie ein Bild über eine URL',
        demo: 'Verwenden Sie das Demo-Bild zum Ausprobieren'
      },
      formatsTitle: 'Unterstützte Formate'
    },
    filters: {
      title: 'Filter & Anpassungen',
      description: 'Mit den Filtern können Sie das Aussehen Ihres Bildes verändern. Alle Änderungen werden in Echtzeit angezeigt.',
      brightness: {
        title: 'Helligkeit',
        description: 'Macht das Bild heller oder dunkler'
      },
      contrast: {
        title: 'Kontrast',
        description: 'Verstärkt oder verringert den Unterschied zwischen hellen und dunklen Bereichen'
      },
      saturation: {
        title: 'Sättigung',
        description: 'Passt die Farbintensität an - von grau bis leuchtend'
      },
      grayscale: {
        title: 'Graustufen',
        description: 'Wandelt das Bild in Schwarz-Weiß um'
      },
      sepia: {
        title: 'Sepia/Wärme',
        description: 'Verleiht dem Bild einen warmen, nostalgischen Braunton'
      },
      sharpness: {
        title: 'Schärfe',
        description: 'Macht Kanten und Details deutlicher sichtbar'
      }
    },
    presets: {
      title: 'Voreinstellungen (Presets)',
      description: 'Wählen Sie eine fertige Voreinstellung für schnelle Bildeffekte. Sie können auch eigene Presets erstellen und speichern.',
      list: {
        original: 'Original',
        vibrant: 'Lebhaft',
        vintage: 'Vintage',
        blackWhite: 'Schwarz-Weiß',
        dramatic: 'Dramatisch',
        soft: 'Weich',
        warm: 'Warm',
        cool: 'Kühl'
      },
      tip: 'Tipp: Erstellen Sie eigene Presets, um Ihre Lieblingseinstellungen zu speichern und schnell anzuwenden.'
    },
    crop: {
      title: 'Zuschneiden',
      description: 'Mit der Zuschneiden-Funktion können Sie einen bestimmten Bereich Ihres Bildes auswählen und den Rest entfernen.',
      steps: {
        step1: 'Klicken Sie auf den "Zuschneiden"-Button in der Werkzeugleiste',
        step2: 'Ziehen Sie mit der Maus einen Rahmen um den gewünschten Bereich',
        step3: 'Passen Sie den Rahmen bei Bedarf an',
        step4: 'Klicken Sie auf "Bestätigen", um das Bild zuzuschneiden'
      }
    },
    transform: {
      title: 'Transformationen',
      description: 'Drehen, spiegeln und zoomen Sie Ihr Bild nach Belieben.',
      rotate: {
        title: 'Drehen',
        description: 'Drehen Sie das Bild um 90° oder 180° in jede Richtung'
      },
      flip: {
        title: 'Spiegeln',
        description: 'Spiegeln Sie das Bild horizontal oder vertikal'
      },
      zoom: {
        title: 'Zoom',
        description: 'Vergrößern oder verkleinern Sie die Ansicht des Bildes'
      },
      border: {
        title: 'Rahmen & Ecken',
        description: 'Fügen Sie einen Rahmen hinzu oder runden Sie die Ecken ab'
      }
    },
    text: {
      title: 'Text hinzufügen',
      description: 'Fügen Sie Text zu Ihrem Bild hinzu und gestalten Sie ihn individuell.',
      features: {
        fontSize: 'Schriftgröße anpassen',
        color: 'Textfarbe wählen',
        fontFamily: 'Aus verschiedenen Schriftarten wählen',
        rotation: 'Text drehen',
        opacity: 'Transparenz einstellen',
        stroke: 'Umrandung hinzufügen',
        shadow: 'Schatten hinzufügen'
      },
      tip: 'Tipp: Klicken Sie auf einen Text im Bild, um ihn auszuwählen und zu bearbeiten. Ziehen Sie den Text an die gewünschte Position.'
    },
    resize: {
      title: 'Größe ändern',
      description: 'Ändern Sie die Abmessungen Ihres Bildes.',
      features: {
        custom: 'Geben Sie Breite und Höhe manuell ein',
        aspectRatio: 'Seitenverhältnis beibehalten für proportionale Größenänderung',
        presets: 'Wählen Sie aus vordefinierten Größen für Social Media und Web'
      }
    },
    export: {
      title: 'Exportieren & Herunterladen',
      description: 'Speichern Sie Ihr bearbeitetes Bild in verschiedenen Formaten.',
      steps: {
        step1: 'Klicken Sie auf den "Download"-Button',
        step2: 'Wählen Sie das gewünschte Dateiformat',
        step3: 'Das Bild wird automatisch heruntergeladen'
      },
      formatsTitle: 'Verfügbare Exportformate'
    },
    gallery: {
      title: 'Galerie',
      description: 'In der Galerie können Sie mehrere Bilder speichern und verwalten.',
      features: {
        upload: 'Laden Sie mehrere Bilder auf einmal hoch',
        preview: 'Zeigen Sie Bilder in einer Vorschau an',
        openEditor: 'Öffnen Sie ein Bild direkt im Editor zur Bearbeitung',
        download: 'Laden Sie Bilder einzeln herunter',
        delete: 'Löschen Sie nicht mehr benötigte Bilder'
      }
    },
    history: {
      title: 'Verlauf (Rückgängig/Wiederholen)',
      description: 'Alle Ihre Bearbeitungsschritte werden gespeichert. Sie können jederzeit Änderungen rückgängig machen oder wiederherstellen.',
      undo: 'Rückgängig',
      redo: 'Wiederholen'
    },
    settings: {
      title: 'Einstellungen',
      description: 'Passen Sie die Anwendung an Ihre Bedürfnisse an.',
      features: {
        language: 'Sprache wechseln (Deutsch/Englisch)',
        theme: 'Zwischen hellem und dunklem Design wechseln'
      }
    },
    cta: {
      title: 'Bereit zum Loslegen?',
      description: 'Öffnen Sie jetzt den Editor und beginnen Sie mit der Bearbeitung Ihrer Bilder!',
      button: 'Zum Editor'
    }
  },
  upload: {
    title: 'Bild hochladen',
    dropzone: 'Bild hier ablegen oder klicken zum Auswählen',
    dropzoneActive: 'Bild hier ablegen...',
    selectFile: 'Datei auswählen',
    supportedFormats: 'Unterstützte Formate',
    maxFileSize: 'Max. Dateigröße',
    loadFromUrl: 'Von URL laden',
    urlPlaceholder: 'Bild-URL eingeben',
    urlLoad: 'URL laden',
    useDemo: 'Demo-Bild verwenden',
    recentUploads: 'Kürzlich hochgeladen'
  },
  filters: {
    title: 'Filter',
    brightness: 'Helligkeit',
    contrast: 'Kontrast',
    saturation: 'Sättigung',
    grayscale: 'Graustufen',
    sepia: 'Sepia',
    sharpen: 'Schärfe',
    blur: 'Weichzeichner',
    zoom: 'Zoom',
    reset: 'Zurücksetzen',
    resetAll: 'Alle zurücksetzen',
    apply: 'Anwenden',
    presets: 'Voreinstellungen'
  },
  presets: {
    title: 'Filter Presets',
    original: 'Original',
    vibrant: 'Lebhaft',
    vintage: 'Vintage',
    blackWhite: 'Schwarz/Weiß',
    dramatic: 'Dramatisch',
    soft: 'Weich',
    warm: 'Warm',
    cool: 'Kühl',
    normal: 'Normal',
    bw: 'Schwarz/Weiß',
    vivid: 'Lebendig',
    sepia: 'Sepia',
    hdr: 'HDR',
    cold: 'Kalt',
    sunset: 'Sonnenuntergang',
    ocean: 'Ozean',
    cinematic: 'Cinematic',
    faded: 'Verblasst',
    custom: 'Benutzerdefiniert',
    actions: {
      save: 'Preset speichern',
      import: 'Presets importieren',
      export: 'Presets exportieren',
      delete: 'Löschen'
    },
    dialogs: {
      saveName: 'Preset-Name:',
      defaultName: 'Mein Preset',
      saveDescription: 'Beschreibung (optional):',
      confirmDelete: 'Möchten Sie dieses Preset wirklich löschen?'
    },
    errors: {
      invalidFormat: 'Ungültiges Dateiformat'
    }
  },
  shortcuts: {
    title: 'Tastaturkürzel',
    close: 'Schließen',
    groups: {
      general: 'Allgemein',
      navigation: 'Navigation',
      editor: 'Editor'
    },
    actions: {
      showHelp: 'Hilfe anzeigen',
      search: 'Suche',
      close: 'Schließen',
      goHome: 'Zur Startseite',
      goEditor: 'Zum Editor',
      goGallery: 'Zur Galerie',
      undo: 'Rückgängig',
      redo: 'Wiederholen',
      save: 'Speichern',
      open: 'Öffnen',
      reset: 'Zurücksetzen'
    }
  },
  settings: {
    title: 'Einstellungen',
    language: 'Sprache',
    theme: 'Theme',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeAuto: 'Automatisch'
  },
  common: {
    ok: 'OK',
    cancel: 'Abbrechen',
    save: 'Speichern',
    close: 'Schließen',
    delete: 'Löschen',
    loading: 'Lädt...'
  },
  toast: {
    crop: {
      modeActivated: 'Ziehen Sie einen Bereich zum Zuschneiden auf',
      tooSmall: 'Crop-Bereich zu klein',
      tooSmallDetail: 'Mindestens 10x10 Pixel erforderlich',
      outOfBounds: 'Crop-Bereich muss vollständig auf dem Bild liegen',
      success: 'Bild zugeschnitten: {width}×{height}px',
      error: 'Fehler beim Zuschneiden des Bildes',
      undoNotAvailable: 'Kein Zuschnitt zum Rückgängigmachen vorhanden',
      undoSuccess: 'Original-Bild wiederhergestellt'
    },
    editor: {
      imageDeleted: 'Bild erfolgreich gelöscht',
      transformApplied: 'Transformationen erfolgreich angewendet',
      transformError: 'Fehler beim Anwenden der Transformationen',
      galleryLoaded: 'Bild aus Galerie geladen',
      galleryError: 'Fehler beim Laden aus Galerie',
      resizeSuccess: 'Bildgröße erfolgreich geändert: {width}×{height}px'
    },
    presets: {
      applied: 'Preset "{name}" angewendet',
      saved: 'Preset "{name}" gespeichert',
      deleted: 'Preset "{name}" gelöscht',
      exported: '{count} Preset(s) exportiert',
      imported: '{count} Preset(s) importiert',
      noCustomPresets: 'Keine benutzerdefinierten Presets vorhanden',
      importError: 'Fehler beim Importieren'
    },
    transform: {
      rotated90: 'Bild um 90° gedreht',
      rotated180: 'Bild um 180° gedreht',
      flippedHorizontal: 'Bild horizontal gespiegelt',
      flippedVertical: 'Bild vertikal gespiegelt',
      reset: 'Transformationen zurückgesetzt'
    },
    batch: {
      filesAdded: '{count} Bild(er) hinzugefügt',
      noImages: 'Keine gültigen Bilddateien gefunden',
      processingStarted: 'Konvertierung gestartet für {count} Bild(er)',
      processingComplete: '{success} von {total} Bild(ern) erfolgreich konvertiert',
      processingCompleteAll: 'Alle {count} Bilder erfolgreich konvertiert!',
      fileError: 'Fehler bei „{name}": {error}',
      downloadStarted: 'Download gestartet',
      downloadAllStarted: 'Download aller {count} Dateien gestartet',
      cleared: 'Alle Dateien entfernt',
      fileRemoved: '„{name}" entfernt'
    },
    conversion: {
      success: '{from} erfolgreich in {to} konvertiert',
      error: 'Konvertierung fehlgeschlagen: {error}',
      downloadStarted: '{filename} wird heruntergeladen',
      uploadReceived: 'Bild empfangen – Konvertierung läuft...'
    }
  },
  layerPanel: {
    tabs: {
      layers: 'Ebenen',
      text: 'Text'
    },
    history: {
      undo: 'Rückgängig (Strg+Z)',
      redo: 'Wiederholen (Strg+Y)',
      preview: 'Vorschau'
    },
    layers: {
      title: 'Ebenen',
      hide: 'Ausblenden',
      show: 'Einblenden',
      delete: 'Löschen',
      moveUp: 'Nach oben',
      moveDown: 'Nach unten',
      duplicate: 'Duplizieren',
      confirmDelete: 'Möchten Sie diesen Layer wirklich löschen?'
    },
    background: {
      title: 'Hintergrund',
      color: 'Hintergrundfarbe',
      transparent: 'Transparent',
      white: 'Weiß',
      black: 'Schwarz',
      lightGray: 'Hellgrau',
      gray: 'Grau',
      red: 'Rot',
      green: 'Grün',
      blue: 'Blau'
    },
    transform: {
      title: 'Transformieren',
      position: 'Position',
      size: 'Größe',
      maintainAspect: 'Seitenverhältnis beibehalten',
      rotation: 'Rotation',
      flip: 'Spiegeln',
      flipHorizontal: 'Horizontal spiegeln',
      flipVertical: 'Vertikal spiegeln',
      horizontal: 'Horizontal',
      vertical: 'Vertikal',
      opacity: 'Deckkraft'
    },
    filters: {
      title: 'Filter',
      brightness: 'Helligkeit',
      contrast: 'Kontrast',
      saturation: 'Sättigung',
      grayscale: 'Graustufen',
      reset: 'Filter zurücksetzen'
    },
    border: {
      title: 'Umrandung',
      width: 'Randstärke',
      color: 'Randfarbe',
      radius: 'Eckenradius'
    },
    shadow: {
      title: 'Schlagschatten',
      enable: 'Schatten aktivieren',
      offsetX: 'Versatz X',
      offsetY: 'Versatz Y',
      blur: 'Unschärfe',
      color: 'Schattenfarbe',
      opacity: 'Deckkraft'
    },
    hints: {
      selectLayer: 'Klicken Sie auf ein Bild im Canvas um es zu bearbeiten',
      addText: 'Klicken Sie auf "Text hinzufügen" um einen neuen Text zu erstellen'
    },
    text: {
      addButton: 'Text hinzufügen',
      listTitle: 'Texte',
      editTitle: 'Text bearbeiten',
      content: 'Inhalt',
      fontSize: 'Schriftgröße',
      fontFamily: 'Schriftart',
      customFonts: 'Benutzerdefinierte Schriften',
      systemFonts: 'System-Schriften',
      color: 'Textfarbe',
      opacity: 'Deckkraft',
      rotation: 'Rotation',
      stroke: 'Kontur',
      strokeWidth: 'Konturstärke',
      strokeColor: 'Konturfarbe',
      textShadow: 'Textschatten',
      shadowBlur: 'Schattenunschärfe',
      shadowX: 'Schatten X',
      shadowY: 'Schatten Y',
      shadowColor: 'Schattenfarbe',
      delete: 'Text löschen',
      confirmDelete: 'Möchten Sie diesen Text wirklich löschen?',
      newText: 'Neuer Text'
    }
  },
  batch: {
    title: 'Batch-Konvertierung',
    subtitle: 'Konvertieren Sie mehrere Bilder gleichzeitig in das gewünschte Format',
    upload: {
      title: 'Bilder hochladen',
      description: 'Ziehen Sie Ihre Bilder hierher oder klicken Sie zum Auswählen',
      hint: 'JPG, PNG, WebP, GIF, BMP und mehr'
    },
    settings: {
      title: 'Konvertierungs-Einstellungen',
      format: 'Zielformat',
      quality: 'Qualität',
      resize: 'Größe ändern',
      width: 'Breite',
      height: 'Höhe',
      maintainAspect: 'Seitenverhältnis beibehalten',
      prefix: 'Dateiname-Präfix',
      prefixPlaceholder: 'z.B. konvertiert_'
    },
    processing: 'Wird konvertiert...',
    start: 'Konvertierung starten',
    downloadAll: 'Alle herunterladen',
    clearAll: 'Alle entfernen',
    files: {
      title: 'Dateien',
      download: 'Herunterladen',
      preview: 'Vorschau'
    },
    preview: {
      original: 'Original',
      processed: 'Konvertiert'
    },
    confirmClear: 'Möchten Sie wirklich alle Dateien entfernen?'
  },
  notFound: {
    title: 'Seite nicht gefunden',
    description: 'Die angeforderte Seite existiert nicht. Möglicherweise wurde sie verschoben oder gelöscht.',
    backHome: 'Zur Startseite'
  }
}

/**
 * English Translations
 */
const en = {
  app: {
    title: 'Image Converter Pro',
    subtitle: 'Fast and Secure Image Editing in Browser',
    version: 'Version',
    changeLanguage: 'Change Language',
    changeTheme: 'Change Theme'
  },
  nav: {
    home: 'Home',
    editor: 'Editor',
    gallery: 'Gallery',
    guide: 'Guide',
    about: 'About',
    upload: 'Upload Image',
    edit: 'Edit',
    filters: 'Filters',
    text: 'Text',
    export: 'Export',
    history: 'History',
    settings: 'Settings'
  },
  locale: 'en-US',
  home: {
    title: 'Welcome to Image Converter Pro',
    subtitle: 'Fast and secure image editing mostly local in your browser, specialized formats securely on German server',
    startEditing: 'Start Editing',
    heroAlt: 'Image Converter Pro - Online image editing and format conversion',
    features: {
      title: 'Features',
      convert: {
        title: 'Format Conversion',
        description: 'Convert images between JPG, PNG, WebP, GIF and more'
      },
      edit: {
        title: 'Image Editing',
        description: 'Real-time filters, adjustments and effects'
      },
      compress: {
        title: 'Compression',
        description: 'Reduce file size without quality loss'
      },
      privacy: {
        title: 'Privacy',
        description: 'Conversion locally in your browser (with necessary server exceptions)'
      },
      fast: {
        title: 'Fast',
        description: 'Instant processing without upload'
      },
      crop: {
        title: 'Crop Images',
        description: 'Crop your images precisely and focus on what matters. Perfect for social media and websites.'
      }
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about our image editor',
      items: {
        formats: {
          question: 'Which image formats are supported?',
          answer: 'Our editor supports PNG, JPEG, WEBP, TIFF, GIF, HAIF, and PDF formats. You can upload images and convert them to any of these formats.'
        },
        privacy: {
          question: 'Are my images safe and private?',
          answer: 'Yes, absolutely. Protecting your data is our top priority. To be transparent, the exact process depends on the file format you choose:\n\n' +
            'For most formats: When you convert common formats like JPG, PNG, WEBP, and PDF, all processing happens 100% locally in your web browser. Your images never leave your device. This is the fastest and most private method we offer for the majority of our formats.\n\n' +
            'For specialized formats: For complex formats like TIFF, GIF, and HAIC, server-side processing on our servers is necessary, as browsers cannot (yet) perform these conversions locally.\n\n' +
            'Our privacy promise for this server processing:\n' +
            '1. Secure upload: Your file is transferred to our server with SSL encryption.\n' +
            '2. Location Germany: Our server is located in Germany and operates strictly according to GDPR regulations.\n' +
            '3. No storage: Your file is used exclusively for the automated conversion process and permanently deleted immediately (at the latest within 15 minutes) after successful conversion.\n' +
            '4. No inspection: Neither the original nor the converted file is stored, analyzed, or viewed by us.'
        },
        filters: {
          question: 'What filters and adjustments can I make?',
          answer: 'You can adjust brightness, contrast, saturation, blur, and hue. Additionally, we offer pre-made presets like Grayscale, Sepia, Vintage, and more for quick style changes.'
        },
        crop: {
          question: 'Can I crop and resize images?',
          answer: 'Yes, you can precisely crop images and adjust their size. Use the crop function to select the desired area, and the resize options to change width and height while maintaining aspect ratio.'
        },
        resize: {
          question: 'Can I rotate and flip images?',
          answer: 'Of course! You can rotate images by 90° or 180°, flip horizontally or vertically, and even perform custom rotations with precise degree input.'
        },
        download: {
          question: 'How do I save my edited image?',
          answer: 'Simply click the download button in the toolbar. You can choose the image format and the edited image will be downloaded directly to your device. No account required!'
        }
      }
    },
    conversions: {
      title: 'Popular Conversions',
      subtitle: 'Choose your desired format – fast, free and directly in your browser'
    },
    webpPromo: {
      title: 'Why WebP? Improve your Google PageSpeed ranking!',
      description: 'WebP offers up to 30% smaller files than PNG and JPG at the same quality. Google recommends WebP for faster loading times – a direct ranking factor for SEO.',
      cta: 'Convert to WebP now'
    }
  },
  conversion: {
    batchCta: 'Convert multiple images',
    widget: {
      dropHint: 'Drop file here or click to select',
      converting: 'Converting...',
      download: 'Download',
      convertAnother: 'Convert another image',
      tryAgain: 'Try again'
    },
    benefits: {
      fast: {
        title: 'Lightning Fast',
        description: 'Conversion in seconds, right in your browser.'
      },
      privacy: {
        title: 'GDPR Compliant',
        description: 'Your images are processed locally. No upload needed.'
      },
      quality: {
        title: 'Best Quality',
        description: 'Choose the quality level – from maximum compression to lossless.'
      }
    },
    howTo: {
      title: 'How it works',
      step1: {
        title: 'Upload image',
        description: 'Drag your image into the editor or click the upload button.'
      },
      step2: {
        title: 'Choose format',
        description: 'Select the desired target format and quality level.'
      },
      step3: {
        title: 'Download',
        description: 'Click download and your converted image will be saved instantly.'
      }
    },
    otherFormats: {
      title: 'More conversions'
    },
    formats: {
      heic: { info: 'Apple format for iPhone photos. High quality at small file size, but limited compatibility.' },
      jpg: { info: 'The most universal image format. Ideal for photos and web content with adjustable compression.' },
      png: { info: 'Lossless format with transparency support. Perfect for graphics, logos and screenshots.' },
      webp: { info: 'Modern Google format. Up to 30% smaller than JPG/PNG at the same quality – ideal for web performance.' },
      tiff: { info: 'Professional print format. Lossless with high color depth – industry standard for print.' },
      gif: { info: 'Supports animations and simple graphics with up to 256 colors.' },
      bmp: { info: 'Uncompressed Windows bitmap format. High quality, but large file size.' },
      svg: { info: 'Vector-based format. Infinitely scalable without quality loss – ideal for logos and icons.' },
      pdf: { info: 'Universal document format. Ideal for printing, archiving and sharing images as documents.' }
    },
    'heic-zu-jpg': {
      title: 'Convert HEIC to JPG – Fast & Free',
      description: 'Easily convert iPhone photos in HEIC format to JPG for free. Directly in your browser, without uploading to external servers.',
      cta: 'Convert HEIC to JPG now',
      whyTitle: 'Why convert HEIC to JPG?',
      advantage: 'JPG is the most universal image format, supported by all devices, browsers and programs. HEIC files from iPhones are often not directly compatible – converting to JPG solves this problem instantly.'
    },
    'png-zu-webp': {
      title: 'Convert PNG to WebP – For Faster Websites',
      description: 'Convert PNG files to the modern WebP format for free. Up to 30% smaller files at the same quality – perfect for web performance and SEO.',
      cta: 'Convert PNG to WebP now',
      whyTitle: 'Why convert PNG to WebP?',
      advantage: 'WebP offers significantly smaller file sizes than PNG at comparable quality and also supports transparency. Google recommends WebP for faster loading times, which directly improves PageSpeed rankings.'
    },
    'jpg-zu-webp': {
      title: 'Convert JPG to WebP – Web Optimization',
      description: 'Convert JPG images to WebP for free. State-of-the-art compression for faster loading times and better Google PageSpeed ranking.',
      cta: 'Convert JPG to WebP now',
      whyTitle: 'Why convert JPG to WebP?',
      advantage: 'WebP compresses images more efficiently than JPG and is supported by all modern browsers. By switching to WebP, you improve your website loading time – an important ranking factor for Google.'
    },
    'webp-zu-png': {
      title: 'Convert WebP to PNG – For Maximum Compatibility',
      description: 'Convert WebP files to PNG for free. Lossless quality with universal compatibility.',
      cta: 'Convert WebP to PNG now',
      whyTitle: 'Why convert WebP to PNG?',
      advantage: 'PNG offers maximum compatibility with all image editing programs and older systems. If you want to use a WebP image for printing or in programs that don\'t support WebP, PNG is the best choice.'
    },
    'jpg-zu-png': {
      title: 'Convert JPG to PNG – For Transparency and Quality',
      description: 'Convert JPG images to PNG for free and losslessly. Ideal when you need transparency or want to avoid quality loss.',
      cta: 'Convert JPG to PNG now',
      whyTitle: 'Why convert JPG to PNG?',
      advantage: 'PNG supports transparency and lossless compression. Ideal when you want to further edit images, remove backgrounds, or create graphics with sharp edges.'
    },
    'png-zu-jpg': {
      title: 'Convert PNG to JPG – Reduce File Size',
      description: 'Convert PNG files to JPG for free. Significantly reduce file size – ideal for email and social media.',
      cta: 'Convert PNG to JPG now',
      whyTitle: 'Why convert PNG to JPG?',
      advantage: 'JPG files are significantly smaller than PNGs. If you don\'t need transparency, you save considerable storage space with JPG – ideal for photos, email attachments and social media posts.'
    },
    'tiff-zu-jpg': {
      title: 'Convert TIFF to JPG – For Web and Email',
      description: 'Convert large TIFF files to compact JPG images for free. Perfect for web uploads and email.',
      cta: 'Convert TIFF to JPG now',
      whyTitle: 'Why convert TIFF to JPG?',
      advantage: 'TIFF files are optimized for print and often very large. JPG massively reduces the file size and enables easy sharing via web, email or social media.'
    },
    'bmp-zu-webp': {
      title: 'Convert BMP to WebP – Massive Compression',
      description: 'Convert uncompressed BMP files to the modern WebP format. Drastic size reduction with excellent quality.',
      cta: 'Convert BMP to WebP now',
      whyTitle: 'Why convert BMP to WebP?',
      advantage: 'BMP files are uncompressed and extremely large. WebP offers state-of-the-art compression and reduces file size by up to 95% – ideal for making old BMP archives web-ready.'
    },
    'gif-zu-webp': {
      title: 'Convert GIF to WebP – Smaller and Sharper',
      description: 'Convert GIF files to WebP for free. Smaller file size with better color depth than GIF.',
      cta: 'Convert GIF to WebP now',
      whyTitle: 'Why convert GIF to WebP?',
      advantage: 'WebP supports more than 256 colors (unlike GIF) and offers better compression. Your images look sharper and load faster – a win for any website.'
    },
    'heic-zu-png': {
      title: 'Convert HEIC to PNG – Lossless Conversion',
      description: 'Convert iPhone HEIC photos to the lossless PNG format for free. Maximum quality with transparency support.',
      cta: 'Convert HEIC to PNG now',
      whyTitle: 'Why convert HEIC to PNG?',
      advantage: 'PNG offers lossless quality and transparency. Ideal when you want to further edit iPhone photos or archive them at the highest quality.'
    },
    'webp-zu-jpg': {
      title: 'Convert WebP to JPG – Universal Compatibility',
      description: 'Convert WebP images to the universal JPG format for free. For maximum compatibility with all devices.',
      cta: 'Convert WebP to JPG now',
      whyTitle: 'Why convert WebP to JPG?',
      advantage: 'JPG is supported by every device and program. If you want to use WebP images in older programs, via email or for print, JPG is the safest choice.'
    },
    'svg-zu-png': {
      title: 'Convert SVG to PNG – Vector to Pixel',
      description: 'Convert SVG vector graphics to PNG pixel images for free. Ideal for social media, presentations and print.',
      cta: 'Convert SVG to PNG now',
      whyTitle: 'Why convert SVG to PNG?',
      advantage: 'SVG is a vector format that cannot be displayed everywhere. PNG is universally compatible and ideal when you need an SVG graphic in a fixed size for social media, presentations or print.'
    },
    'jpg-zu-pdf': {
      title: 'Convert JPG to PDF – Images as Documents',
      description: 'Convert JPG images to PDF documents for free. Perfect for printing, applications, archiving and professional sharing.',
      cta: 'Convert JPG to PDF now',
      whyTitle: 'Why convert JPG to PDF?',
      advantage: 'PDF is the universal document format and displays identically on every device. Ideal for sending photos professionally, printing or archiving – with guaranteed display across all platforms.'
    },
    'png-zu-svg': {
      title: 'Convert PNG to SVG – Image to Vector Format',
      description: 'Convert PNG images to SVG format for free. Creates an SVG file with embedded raster image – compatible with all vector graphics editors.',
      cta: 'Convert PNG to SVG now',
      whyTitle: 'Why convert PNG to SVG?',
      advantage: 'SVG is the standard format for web graphics and is supported by all modern browsers and design tools. The conversion produces an SVG file you can use in Illustrator, Figma or as a web graphic.'
    }
  },
  editor: {
    toolbar: {
      upload: 'Upload',
      reset: 'Reset',
      clearImage: 'Clear Image',
      preview: 'Preview',
      download: 'Download',
      undo: 'Undo',
      redo: 'Redo'
    },
    sidebar: {
      format: 'Format',
      background: 'Background',
      adjustments: 'Adjustments',
      lightColor: 'Light & Color',
      effects: 'Effects',
      presets: 'Presets',
      resize: 'Resize'
    },
    background: {
      color: 'Color',
      opacity: 'Opacity',
      hint: 'Load an image to adjust background'
    },
    filters: {
      brightness: 'Brightness',
      contrast: 'Contrast',
      saturation: 'Saturation',
      blur: 'Blur',
      hue: 'Hue',
      exposure: 'Exposure',
      highlights: 'Highlights',
      shadows: 'Shadows',
      sepia: 'Warmth',
      grayscale: 'Grayscale',
      invert: 'Invert',
      vignette: 'Vignette',
      sharpness: 'Sharpness'
    },
    presets: {
      normal: 'Normal',
      vintage: 'Vintage',
      bw: 'Black & White',
      vivid: 'Vivid',
      cold: 'Cold',
      warm: 'Warm'
    },
    resize: {
      width: 'Width',
      height: 'Height',
      maintainAspect: 'Maintain Aspect Ratio',
      apply: 'Apply',
      presets: 'Presets',
      selectPreset: 'Select preset...'
    },
    canvas: {
      empty: {
        title: 'No Image Loaded',
        description: 'Upload an image to get started',
        button: 'Upload Image'
      }
    },
    export: {
      quality: 'Quality',
      transparentBackground: 'Transparent background'
    }
  },
  transform: {
    crop: {
      title: 'Crop',
      button: 'Crop',
      confirm: 'Confirm',
      undo: 'Undo',
      aspectRatio: 'Aspect Ratio',
      presets: {
        free: 'Free',
        circle: 'Circle'
      }
    },
    title: 'Transformations',
    opacity: 'Opacity',
    rotation: 'Rotation',
    rotationTooltip: {
      counterClockwise: '90° counter-clockwise',
      rotate180: 'Rotate 180°',
      clockwise: '90° clockwise'
    },
    flip: {
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      horizontalTooltip: 'Flip horizontally',
      verticalTooltip: 'Flip vertically'
    },
    zoom: 'Zoom',
    panHint: 'Space + Drag or middle mouse button to pan',
    resetPan: 'Center view',
    borderRadius: 'Round corners',
    borderRadiusHint: '50% = full circle',
    border: 'Border',
    borderColor: 'Color',
    shadow: {
      title: 'Drop Shadow',
      offsetX: 'X-Offset',
      offsetY: 'Y-Offset',
      blur: 'Blur',
      opacity: 'Opacity',
      color: 'Color'
    },
    skew: {
      title: 'Skew',
      horizontal: 'Horizontal',
      vertical: 'Vertical'
    },
    apply: 'Apply',
    applyTooltip: 'Apply transformations permanently',
    reset: 'Reset'
  },
  textModal: {
    addTitle: 'Add Text',
    editTitle: 'Edit Text',
    text: 'Text',
    textPlaceholder: 'Enter your text...',
    fontSize: 'Font Size',
    color: 'Color',
    fontFamily: 'Font Family',
    add: 'Add',
    update: 'Update',
    delete: 'Delete',
    cancel: 'Cancel',
    undo: 'Undo',
    redo: 'Redo'
  },
  textPanel: {
    title: 'Edit Text',
    content: 'Text',
    placeholder: 'Enter text...',
    fontSize: 'Font Size',
    fontFamily: 'Font Family',
    customFonts: 'Custom Fonts',
    systemFonts: 'System Fonts',
    color: 'Color',
    rotation: 'Rotation',
    opacity: 'Opacity',
    strokeWidth: 'Stroke',
    strokeColor: 'Stroke Color',
    shadow: 'Shadow',
    shadowColor: 'Shadow Color',
    undo: 'Undo',
    redo: 'Redo',
    delete: 'Delete Text',
    deselect: 'Deselect',
    selectHint: 'Click on a text in the image to edit it'
  },
  gallery: {
    title: 'Gallery',
    subtitle: 'Manage Your Images',
    search: 'Search images...',
    filters: {
      all: 'All',
      recent: 'Recent',
      edited: 'Edited',
      favorites: 'Favorites'
    },
    gridView: 'Grid View',
    listView: 'List View',
    buttons: {
      upload: 'Upload Images',
      deleteAll: 'Delete All Images',
      addToEditor: 'Add to Editor',
      delete: 'Delete',
      preview: 'Preview',
      download: 'Download',
      openInEditor: 'Open in Editor',
      selectMultiple: 'Multi-Select',
      cancelSelection: 'Cancel',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      createCollage: 'Create Collage'
    },
    errors: {
      minTwoImages: 'Please select at least 2 images',
      collageError: 'Error creating collage'
    },
    empty: {
      title: 'No Images in Gallery',
      description: 'Use the "Upload Images" button above to add your first images',
      button: 'Upload Images'
    },
    imageCount: {
      single: 'Image',
      plural: 'Images'
    },
    info: {
      name: 'Name',
      size: 'Size',
      dimensions: 'Dimensions',
      uploaded: 'Uploaded',
      format: 'Format'
    },
    actions: {
      select: 'Select',
      deselect: 'Deselect',
      selectAll: 'Select All',
      deselectAll: 'Deselect All'
    },
    files: {
      download: 'Download',
      preview: 'Preview'
    },
    preview: {
      title: 'Image Preview',
      original: 'Original',
      processed: 'Processed',
      close: 'Close'
    },
    confirmDelete: 'Do you really want to delete "{name}"?',
    confirmDeleteAll: '⚠️ WARNING: Do you really want to delete ALL {count} {images} from the gallery?\n\nThis action cannot be undone!',
    deleteSuccess: '{count} {images} deleted',
    uploadSuccess: '{count} {images} successfully uploaded',
    uploadError: 'Error uploading {name}',
    noSelection: 'No image selected',
    tooltips: {
      upload: 'Add new images to the gallery',
      deleteAll: 'Delete all images from the gallery',
      preview: 'Show image preview',
      addToEditor: 'Open selected image in editor',
      delete: 'Delete selected image'
    }
  },
  about: {
    title: 'About Image Converter Pro',
    subtitle: 'Fast and secure image editing',
    mission: {
      title: 'Our Mission',
      description: 'Making image editing simple and accessible for everyone'
    },
    privacy: {
      title: 'Privacy',
      description: 'Conversion locally in your browser (with necessary server exceptions)'
    },
    technology: {
      title: 'Technology',
      description: 'Modern web technologies for best performance'
    },
    features: {
      title: 'Features',
      offline: {
        title: 'Offline Usage',
        description: 'Works completely offline'
      },
      formats: {
        title: 'Supported Formats',
        description: 'PNG, JPEG, WEBP, TIFF, GIF, HAIF, and PDF'
      },
      quality: {
        title: 'High Quality',
        description: 'Lossless editing possible'
      },
      editor: {
        title: 'Full Editor',
        description: 'Filters, adjustments and more'
      },
      free: {
        title: 'Free',
        description: 'Completely free to use'
      }
    },
    techStack: {
      title: 'Technology Stack',
      vue: 'Modern Vue.js Framework',
      i18n: 'Multi-language Support',
      pinia: 'State Management',
      vite: 'Fast Build Tool',
      scss: 'Modern Styling',
      canvas: 'Image Processing'
    },
    version: {
      title: 'Version',
      releaseDate: 'Released on'
    },
    links: {
      github: 'GitHub',
      documentation: 'Documentation'
    },
    contact: {
      title: 'Contact',
      description: 'Have questions or feedback?'
    }
  },
  guide: {
    title: 'User Guide',
    subtitle: 'Learn all the features of the Image Converter',
    quickStart: {
      title: 'Quick Start',
      step1: {
        title: 'Upload Image',
        description: 'Drag an image into the editor or click "Upload Image" to select a file.'
      },
      step2: {
        title: 'Edit Image',
        description: 'Use filters, adjustments, and transformations to customize your image.'
      },
      step3: {
        title: 'Save & Download',
        description: 'Choose your desired format and download the finished image.'
      }
    },
    upload: {
      title: 'Upload Images',
      description: 'There are several ways to load an image into the editor:',
      methods: {
        dragDrop: 'Drag an image directly into the editor (Drag & Drop)',
        fileSelect: 'Click "Upload Image" and select a file',
        url: 'Load an image via URL',
        demo: 'Use the demo image to try out'
      },
      formatsTitle: 'Supported Formats'
    },
    filters: {
      title: 'Filters & Adjustments',
      description: 'Use filters to change the appearance of your image. All changes are displayed in real-time.',
      brightness: {
        title: 'Brightness',
        description: 'Makes the image brighter or darker'
      },
      contrast: {
        title: 'Contrast',
        description: 'Increases or decreases the difference between light and dark areas'
      },
      saturation: {
        title: 'Saturation',
        description: 'Adjusts color intensity - from gray to vibrant'
      },
      grayscale: {
        title: 'Grayscale',
        description: 'Converts the image to black and white'
      },
      sepia: {
        title: 'Sepia/Warmth',
        description: 'Gives the image a warm, nostalgic brown tone'
      },
      sharpness: {
        title: 'Sharpness',
        description: 'Makes edges and details more visible'
      }
    },
    presets: {
      title: 'Presets',
      description: 'Choose a ready-made preset for quick image effects. You can also create and save your own presets.',
      list: {
        original: 'Original',
        vibrant: 'Vibrant',
        vintage: 'Vintage',
        blackWhite: 'Black & White',
        dramatic: 'Dramatic',
        soft: 'Soft',
        warm: 'Warm',
        cool: 'Cool'
      },
      tip: 'Tip: Create your own presets to save your favorite settings and apply them quickly.'
    },
    crop: {
      title: 'Crop',
      description: 'Use the crop function to select a specific area of your image and remove the rest.',
      steps: {
        step1: 'Click the "Crop" button in the toolbar',
        step2: 'Draw a frame around the desired area with your mouse',
        step3: 'Adjust the frame if needed',
        step4: 'Click "Confirm" to crop the image'
      }
    },
    transform: {
      title: 'Transformations',
      description: 'Rotate, flip, and zoom your image as you like.',
      rotate: {
        title: 'Rotate',
        description: 'Rotate the image by 90° or 180° in any direction'
      },
      flip: {
        title: 'Flip',
        description: 'Flip the image horizontally or vertically'
      },
      zoom: {
        title: 'Zoom',
        description: 'Enlarge or reduce the view of the image'
      },
      border: {
        title: 'Border & Corners',
        description: 'Add a border or round the corners'
      }
    },
    text: {
      title: 'Add Text',
      description: 'Add text to your image and customize it individually.',
      features: {
        fontSize: 'Adjust font size',
        color: 'Choose text color',
        fontFamily: 'Select from various fonts',
        rotation: 'Rotate text',
        opacity: 'Set transparency',
        stroke: 'Add outline',
        shadow: 'Add shadow'
      },
      tip: 'Tip: Click on text in the image to select and edit it. Drag the text to the desired position.'
    },
    resize: {
      title: 'Resize',
      description: 'Change the dimensions of your image.',
      features: {
        custom: 'Enter width and height manually',
        aspectRatio: 'Maintain aspect ratio for proportional resizing',
        presets: 'Choose from predefined sizes for social media and web'
      }
    },
    export: {
      title: 'Export & Download',
      description: 'Save your edited image in various formats.',
      steps: {
        step1: 'Click the "Download" button',
        step2: 'Choose the desired file format',
        step3: 'The image will be downloaded automatically'
      },
      formatsTitle: 'Available Export Formats'
    },
    gallery: {
      title: 'Gallery',
      description: 'In the gallery you can store and manage multiple images.',
      features: {
        upload: 'Upload multiple images at once',
        preview: 'View images in a preview',
        openEditor: 'Open an image directly in the editor for editing',
        download: 'Download images individually',
        delete: 'Delete images you no longer need'
      }
    },
    history: {
      title: 'History (Undo/Redo)',
      description: 'All your editing steps are saved. You can undo or redo changes at any time.',
      undo: 'Undo',
      redo: 'Redo'
    },
    settings: {
      title: 'Settings',
      description: 'Customize the application to your needs.',
      features: {
        language: 'Switch language (German/English)',
        theme: 'Switch between light and dark design'
      }
    },
    cta: {
      title: 'Ready to Get Started?',
      description: 'Open the editor now and start editing your images!',
      button: 'Go to Editor'
    }
  },
  upload: {
    title: 'Upload Image',
    dropzone: 'Drop image here or click to select',
    dropzoneActive: 'Drop image here...',
    selectFile: 'Select File',
    supportedFormats: 'Supported Formats',
    maxFileSize: 'Max File Size',
    loadFromUrl: 'Load from URL',
    urlPlaceholder: 'Enter image URL',
    urlLoad: 'Load URL',
    useDemo: 'Use Demo Image',
    recentUploads: 'Recent Uploads'
  },
  filters: {
    title: 'Filters',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    grayscale: 'Grayscale',
    sepia: 'Sepia',
    sharpen: 'Sharpen',
    blur: 'Blur',
    zoom: 'Zoom',
    reset: 'Reset',
    resetAll: 'Reset All',
    apply: 'Apply',
    presets: 'Presets'
  },
  presets: {
    title: 'Filter Presets',
    original: 'Original',
    vibrant: 'Vibrant',
    vintage: 'Vintage',
    blackWhite: 'Black & White',
    dramatic: 'Dramatic',
    soft: 'Soft',
    warm: 'Warm',
    cool: 'Cool',
    normal: 'Normal',
    bw: 'Black/White',
    vivid: 'Vivid',
    sepia: 'Sepia',
    hdr: 'HDR',
    cold: 'Cold',
    sunset: 'Sunset',
    ocean: 'Ocean',
    cinematic: 'Cinematic',
    faded: 'Faded',
    custom: 'Custom',
    actions: {
      save: 'Save preset',
      import: 'Import presets',
      export: 'Export presets',
      delete: 'Delete'
    },
    dialogs: {
      saveName: 'Preset name:',
      defaultName: 'My Preset',
      saveDescription: 'Description (optional):',
      confirmDelete: 'Do you really want to delete this preset?'
    },
    errors: {
      invalidFormat: 'Invalid file format'
    }
  },
  shortcuts: {
    title: 'Keyboard Shortcuts',
    close: 'Close',
    groups: {
      general: 'General',
      navigation: 'Navigation',
      editor: 'Editor'
    },
    actions: {
      showHelp: 'Show Help',
      search: 'Search',
      close: 'Close',
      goHome: 'Go to Home',
      goEditor: 'Go to Editor',
      goGallery: 'Go to Gallery',
      undo: 'Undo',
      redo: 'Redo',
      save: 'Save',
      open: 'Open',
      reset: 'Reset'
    }
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeAuto: 'Auto'
  },
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    delete: 'Delete',
    loading: 'Loading...'
  },
  toast: {
    crop: {
      modeActivated: 'Drag an area to crop',
      tooSmall: 'Crop area too small',
      tooSmallDetail: 'Minimum 10x10 pixels required',
      outOfBounds: 'Crop area must be completely within the image',
      success: 'Image cropped: {width}×{height}px',
      error: 'Error cropping image',
      undoNotAvailable: 'No crop to undo',
      undoSuccess: 'Original image restored'
    },
    editor: {
      imageDeleted: 'Image successfully deleted',
      transformApplied: 'Transformations successfully applied',
      transformError: 'Error applying transformations',
      galleryLoaded: 'Image loaded from gallery',
      galleryError: 'Error loading from gallery',
      resizeSuccess: 'Image size successfully changed: {width}×{height}px'
    },
    presets: {
      applied: 'Preset "{name}" applied',
      saved: 'Preset "{name}" saved',
      deleted: 'Preset "{name}" deleted',
      exported: '{count} preset(s) exported',
      imported: '{count} preset(s) imported',
      noCustomPresets: 'No custom presets available',
      importError: 'Error importing presets'
    },
    transform: {
      rotated90: 'Image rotated 90°',
      rotated180: 'Image rotated 180°',
      flippedHorizontal: 'Image flipped horizontally',
      flippedVertical: 'Image flipped vertically',
      reset: 'Transformations reset'
    },
    batch: {
      filesAdded: '{count} image(s) added',
      noImages: 'No valid image files found',
      processingStarted: 'Conversion started for {count} image(s)',
      processingComplete: '{success} of {total} image(s) successfully converted',
      processingCompleteAll: 'All {count} images successfully converted!',
      fileError: 'Error on "{name}": {error}',
      downloadStarted: 'Download started',
      downloadAllStarted: 'Downloading all {count} files',
      cleared: 'All files removed',
      fileRemoved: '"{name}" removed'
    },
    conversion: {
      success: '{from} successfully converted to {to}',
      error: 'Conversion failed: {error}',
      downloadStarted: 'Downloading {filename}',
      uploadReceived: 'Image received – converting...'
    }
  },
  layerPanel: {
    tabs: {
      layers: 'Layers',
      text: 'Text'
    },
    history: {
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      preview: 'Preview'
    },
    layers: {
      title: 'Layers',
      hide: 'Hide',
      show: 'Show',
      delete: 'Delete',
      moveUp: 'Move up',
      moveDown: 'Move down',
      duplicate: 'Duplicate',
      confirmDelete: 'Do you really want to delete this layer?'
    },
    background: {
      title: 'Background',
      color: 'Background color',
      transparent: 'Transparent',
      white: 'White',
      black: 'Black',
      lightGray: 'Light gray',
      gray: 'Gray',
      red: 'Red',
      green: 'Green',
      blue: 'Blue'
    },
    transform: {
      title: 'Transform',
      position: 'Position',
      size: 'Size',
      maintainAspect: 'Maintain aspect ratio',
      rotation: 'Rotation',
      flip: 'Flip',
      flipHorizontal: 'Flip horizontally',
      flipVertical: 'Flip vertically',
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      opacity: 'Opacity'
    },
    filters: {
      title: 'Filters',
      brightness: 'Brightness',
      contrast: 'Contrast',
      saturation: 'Saturation',
      grayscale: 'Grayscale',
      reset: 'Reset filters'
    },
    border: {
      title: 'Border',
      width: 'Border width',
      color: 'Border color',
      radius: 'Corner radius'
    },
    shadow: {
      title: 'Drop Shadow',
      enable: 'Enable shadow',
      offsetX: 'Offset X',
      offsetY: 'Offset Y',
      blur: 'Blur',
      color: 'Shadow color',
      opacity: 'Opacity'
    },
    hints: {
      selectLayer: 'Click on an image in the canvas to edit it',
      addText: 'Click on "Add text" to create a new text'
    },
    text: {
      addButton: 'Add text',
      listTitle: 'Texts',
      editTitle: 'Edit text',
      content: 'Content',
      fontSize: 'Font size',
      fontFamily: 'Font family',
      customFonts: 'Custom Fonts',
      systemFonts: 'System Fonts',
      color: 'Text color',
      opacity: 'Opacity',
      rotation: 'Rotation',
      stroke: 'Stroke',
      strokeWidth: 'Stroke width',
      strokeColor: 'Stroke color',
      textShadow: 'Text shadow',
      shadowBlur: 'Shadow blur',
      shadowX: 'Shadow X',
      shadowY: 'Shadow Y',
      shadowColor: 'Shadow color',
      delete: 'Delete text',
      confirmDelete: 'Do you really want to delete this text?',
      newText: 'New Text'
    }
  },
  batch: {
    title: 'Batch Conversion',
    subtitle: 'Convert multiple images at once to your desired format',
    upload: {
      title: 'Upload Images',
      description: 'Drag your images here or click to select',
      hint: 'JPG, PNG, WebP, GIF, BMP and more'
    },
    settings: {
      title: 'Conversion Settings',
      format: 'Target Format',
      quality: 'Quality',
      resize: 'Resize',
      width: 'Width',
      height: 'Height',
      maintainAspect: 'Maintain aspect ratio',
      prefix: 'Filename Prefix',
      prefixPlaceholder: 'e.g. converted_'
    },
    processing: 'Converting...',
    start: 'Start Conversion',
    downloadAll: 'Download All',
    clearAll: 'Remove All',
    files: {
      title: 'Files',
      download: 'Download',
      preview: 'Preview'
    },
    preview: {
      original: 'Original',
      processed: 'Converted'
    },
    confirmClear: 'Do you really want to remove all files?'
  },
  notFound: {
    title: 'Page not found',
    description: 'The requested page does not exist. It may have been moved or deleted.',
    backHome: 'Back to Home'
  }
}

/**
 * i18n-Konfiguration
 */
export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('bildkonverter-locale') || 'de',
  fallbackLocale: 'de',
  messages: {
    de,
    en
  }
})

export default i18n
