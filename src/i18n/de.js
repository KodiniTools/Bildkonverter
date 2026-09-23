/**
 * Deutsche Übersetzungen (de)
 *
 * Alle Schlüssel werden in der App referenziert – als Literal, über Datenarrays
 * (z.B. Guide-Features) oder über Template-Präfixe wie `guide.filters.${key}`.
 */

export default {
  nav: {
    home: 'Startseite',
    editor: 'Editor',
    gallery: 'Galerie',
    guide: 'Anleitung',
    about: 'Über uns',
    faq: 'FAQ',
    blog: 'Blog',
  },
  locale: 'de-DE',
  home: {
    title: 'Willkommen beim Bildkonverter Pro',
    subtitle:
      'Schnelle und sichere Bildbearbeitung meist lokal im Browser, Spezialformate sicher auf dem deutschen Server',
    startEditing: 'Bearbeitung starten',
    heroAlt: 'Bildkonverter Pro - Online-Bildbearbeitung und Formatkonvertierung',
    features: {
      title: 'Funktionen',
      convert: {
        title: 'Format-Konvertierung',
        description: 'Konvertiere Bilder zwischen JPG, PNG, WebP, GIF und mehr',
      },
      edit: {
        title: 'Bildbearbeitung',
        description: 'Filter, Anpassungen und Effekte in Echtzeit',
      },
      compress: {
        title: 'Komprimierung',
        description: 'Reduziere Dateigröße ohne Qualitätsverlust',
      },
      privacy: {
        title: 'Datenschutz',
        description: 'Konvertierung lokal im Browser (mit notwendigen Server-Ausnahmen)',
      },
      fast: {
        title: 'Schnell',
        description: 'Sofortige Verarbeitung ohne Upload',
      },
      crop: {
        title: 'Bilder zuschneiden',
        description:
          'Schneiden Sie Ihre Bilder präzise zu und fokussieren Sie auf das Wesentliche. Perfekt für Social Media und Webseiten.',
      },
    },
    batchLink: 'mehrere Bilder konvertieren',
    conversions: {
      title: 'Beliebte Konvertierungen',
      subtitle: 'Wählen Sie Ihr gewünschtes Format – schnell, kostenlos und direkt im Browser',
    },
    moreTools: {
      title: 'Weitere Bild-Tools von KodiniTools',
      subtitle: 'Entdecken Sie unsere kostenlosen Online-Tools für Bildbearbeitung',
      batchEditor: {
        title: 'Bilderserie bearbeiten',
        description:
          'Bearbeiten Sie ganze Bilderserien auf einmal – Größe ändern, zuschneiden und Filter anwenden im Stapelmodus.',
      },
      collageMaker: {
        title: 'Collage Maker',
        description:
          'Erstellen Sie beeindruckende Fotocollagen aus Ihren Bildern – mit flexiblen Layouts und Anpassungen.',
      },
      colorExtractor: {
        title: 'Color Extractor',
        description:
          'Extrahieren Sie Farbpaletten aus Bildern – perfekt für Designer, Webentwickler und kreative Projekte.',
      },
      cta: 'Jetzt ausprobieren',
    },
    webpPromo: {
      title: 'Warum WebP? Verbessere dein Google PageSpeed Ranking!',
      description:
        'WebP bietet bis zu 30% kleinere Dateien als PNG und JPG bei gleicher Qualität. Google empfiehlt WebP für schnellere Ladezeiten – ein direkter Ranking-Faktor für SEO.',
      cta: 'Jetzt zu WebP konvertieren',
    },
  },
  faq: {
    title: 'Häufig gestellte Fragen',
    subtitle: 'Alles, was Sie über unseren Bildeditor wissen müssen',
    items: {
      formats: {
        question: 'Welche Bildformate werden unterstützt?',
        answer:
          'Unser Editor unterstützt PNG, JPEG, WEBP, TIFF, GIF, HAIF und PDF Formate. Sie können Bilder hochladen und in jedes dieser Formate konvertieren.',
      },
      privacy: {
        question: 'Sind meine Bilder sicher und privat?',
        answer:
          'Ja, absolut. Der Schutz Ihrer Daten hat für uns höchste Priorität. Um transparent zu sein, hängt der genaue Prozess vom gewählten Dateiformat ab:\n\nFür die meisten Formate: Wenn Sie gängige Formate wie JPG, PNG, WEBP und PDF konvertieren, findet die gesamte Verarbeitung zu 100% lokal in Ihrem Webbrowser statt. Ihre Bilder verlassen Ihr Gerät zu keinem Zeitpunkt. Dies ist die schnellste und privateste Methode, die wir für die Mehrheit unserer Formate anbieten.\n\nFür Spezialformate: Für komplexe Formate wie TIFF, GIF, HEIC und Kamera-RAW (CR2, NEF, ARW, DNG u. a.) ist eine serverseitige Verarbeitung auf unseren Servern nötig, da Browser diese Umwandlung (noch) nicht lokal durchführen können.\n\nUnser Datenschutz-Versprechen für diese Server-Verarbeitung:\n1. Sicherer Upload: Ihre Datei wird SSL-verschlüsselt auf unseren Server übertragen.\n2. Standort Deutschland: Unser Server steht in Deutschland und arbeitet streng nach DSGVO-Richtlinien.\n3. Keine Speicherung: Ihre Datei wird ausschließlich für den automatisierten Konvertierungsprozess genutzt und unmittelbar (spätestens innerhalb von 15 Minuten) nach der erfolgreichen Konvertierung dauerhaft gelöscht.\n4. Keine Einsicht: Weder das Original noch die konvertierte Datei wird von uns gespeichert, analysiert oder eingesehen.',
      },
      filters: {
        question: 'Welche Filter und Anpassungen kann ich vornehmen?',
        answer:
          'Sie können Helligkeit, Kontrast, Sättigung, Unschärfe und Farbton anpassen. Zusätzlich bieten wir vorgefertigte Presets wie Grayscale, Sepia, Vintage und mehr für schnelle Stiländerungen.',
      },
      crop: {
        question: 'Kann ich Bilder zuschneiden und in der Größe ändern?',
        answer:
          'Ja, Sie können Bilder präzise zuschneiden und die Größe anpassen. Mit der Crop-Funktion wählen Sie den gewünschten Bereich aus, und mit den Resize-Optionen ändern Sie Breite und Höhe bei Beibehaltung des Seitenverhältnisses.',
      },
      resize: {
        question: 'Kann ich Bilder drehen und spiegeln?',
        answer:
          'Selbstverständlich! Sie können Bilder um 90° oder 180° drehen, horizontal oder vertikal spiegeln und sogar benutzerdefinierte Rotationen mit präziser Gradeingabe durchführen.',
      },
      download: {
        question: 'Wie speichere ich mein bearbeitetes Bild?',
        answer:
          'Klicken Sie einfach auf den Download-Button in der Toolbar. Sie können das Bildformat wählen und das bearbeitete Bild wird direkt auf Ihr Gerät heruntergeladen. Kein Account erforderlich!',
      },
    },
  },
  conversion: {
    batchCta: 'Mehrere Bilder konvertieren',
    widget: {
      dropHint: 'Datei hierher ziehen oder klicken zum Auswählen',
      converting: 'Wird konvertiert...',
      download: 'Herunterladen',
      convertAnother: 'Weiteres Bild konvertieren',
      tryAgain: 'Erneut versuchen',
    },
    benefits: {
      fast: {
        title: 'Blitzschnell',
        description: 'Konvertierung in Sekunden, direkt in Ihrem Browser.',
      },
      privacy: {
        title: 'DSGVO-konform',
        description: 'Ihre Bilder werden lokal verarbeitet. Kein Upload nötig.',
      },
      quality: {
        title: 'Beste Qualität',
        description: 'Wählen Sie die Qualitätsstufe – von maximaler Kompression bis verlustfrei.',
      },
    },
    howTo: {
      title: 'So funktioniert es',
      step1: {
        title: 'Bild hochladen',
        description: 'Ziehen Sie Ihr Bild in den Editor oder klicken Sie auf den Upload-Button.',
      },
      step2: {
        title: 'Format wählen',
        description: 'Wählen Sie das gewünschte Zielformat und die Qualitätsstufe.',
      },
      step3: {
        title: 'Herunterladen',
        description: 'Klicken Sie auf Download und Ihr konvertiertes Bild wird sofort gespeichert.',
      },
    },
    otherFormats: {
      title: 'Weitere Konvertierungen',
    },
    formats: {
      heic: {
        info: 'Apple-Format für iPhone-Fotos. Hohe Qualität bei geringer Dateigröße, aber eingeschränkte Kompatibilität.',
      },
      jpg: {
        info: 'Das universellste Bildformat. Ideal für Fotos und Web-Inhalte mit einstellbarer Kompression.',
      },
      png: {
        info: 'Verlustfreies Format mit Transparenz-Unterstützung. Perfekt für Grafiken, Logos und Screenshots.',
      },
      webp: {
        info: 'Modernes Google-Format. Bis zu 30% kleiner als JPG/PNG bei gleicher Qualität – ideal für Web-Performance.',
      },
      tiff: {
        info: 'Professionelles Druckformat. Verlustfrei mit hoher Farbtiefe – Standard in der Druckindustrie.',
      },
      gif: {
        info: 'Unterstützt Animationen und einfache Grafiken mit bis zu 256 Farben.',
      },
      bmp: {
        info: 'Unkomprimiertes Windows-Bitmap-Format. Hohe Qualität, aber große Dateigröße.',
      },
      svg: {
        info: 'Vektorbasiertes Format. Unendlich skalierbar ohne Qualitätsverlust – ideal für Logos und Icons.',
      },
      pdf: {
        info: 'Universelles Dokumentenformat. Ideal für den Druck, Archivierung und den Austausch von Bildern als Dokument.',
      },
    },
    'heic-zu-jpg': {
      title: 'HEIC in JPG umwandeln – Schnell & Kostenlos',
      description:
        'iPhone-Fotos im HEIC-Format einfach und kostenlos in JPG konvertieren. Direkt im Browser, ohne Upload auf externe Server.',
      cta: 'HEIC jetzt in JPG konvertieren',
      whyTitle: 'Warum HEIC in JPG umwandeln?',
      advantage:
        'JPG ist das universellste Bildformat und wird von allen Geräten, Browsern und Programmen unterstützt. HEIC-Dateien von iPhones sind oft nicht direkt kompatibel – die Konvertierung zu JPG löst dieses Problem sofort.',
    },
    'png-zu-webp': {
      title: 'PNG in WebP umwandeln – Für schnellere Websites',
      description:
        'PNG-Dateien kostenlos in das moderne WebP-Format konvertieren. Bis zu 30% kleinere Dateien bei gleicher Qualität – perfekt für Web-Performance und SEO.',
      cta: 'PNG jetzt in WebP konvertieren',
      whyTitle: 'Warum PNG zu WebP konvertieren?',
      advantage:
        'WebP bietet deutlich kleinere Dateigrößen als PNG bei vergleichbarer Qualität und unterstützt ebenfalls Transparenz. Google empfiehlt WebP für schnellere Ladezeiten, was direkt das PageSpeed-Ranking verbessert.',
    },
    'jpg-zu-webp': {
      title: 'JPG in WebP umwandeln – Web-Optimierung',
      description:
        'JPG-Bilder kostenlos in WebP konvertieren. Modernste Kompression für schnellere Ladezeiten und besseres Google PageSpeed Ranking.',
      cta: 'JPG jetzt in WebP konvertieren',
      whyTitle: 'Warum JPG zu WebP konvertieren?',
      advantage:
        'WebP komprimiert Bilder effizienter als JPG und wird von allen modernen Browsern unterstützt. Durch den Wechsel zu WebP verbessern Sie die Ladezeit Ihrer Website – ein wichtiger Ranking-Faktor bei Google.',
    },
    'webp-zu-png': {
      title: 'WebP in PNG umwandeln – Für maximale Kompatibilität',
      description:
        'WebP-Dateien kostenlos in PNG konvertieren. Verlustfreie Qualität mit universeller Kompatibilität.',
      cta: 'WebP jetzt in PNG konvertieren',
      whyTitle: 'Warum WebP zu PNG konvertieren?',
      advantage:
        'PNG bietet maximale Kompatibilität mit allen Bildbearbeitungsprogrammen und älteren Systemen. Wenn Sie ein WebP-Bild für den Druck oder in Programmen verwenden möchten, die WebP nicht unterstützen, ist PNG die beste Wahl.',
    },
    'jpg-zu-png': {
      title: 'JPG in PNG umwandeln – Für Transparenz und Qualität',
      description:
        'JPG-Bilder kostenlos und verlustfrei in PNG konvertieren. Ideal wenn Sie Transparenz benötigen oder Qualitätsverluste vermeiden möchten.',
      cta: 'JPG jetzt in PNG konvertieren',
      whyTitle: 'Warum JPG zu PNG konvertieren?',
      advantage:
        'PNG unterstützt Transparenz und verlustfreie Kompression. Ideal wenn Sie Bilder weiterbearbeiten, Hintergründe entfernen oder Grafiken mit scharfen Kanten erstellen möchten.',
    },
    'png-zu-jpg': {
      title: 'PNG in JPG umwandeln – Dateigröße reduzieren',
      description:
        'PNG-Dateien kostenlos in JPG konvertieren. Reduzieren Sie die Dateigröße deutlich – ideal für den E-Mail-Versand und Social Media.',
      cta: 'PNG jetzt in JPG konvertieren',
      whyTitle: 'Warum PNG zu JPG konvertieren?',
      advantage:
        'JPG-Dateien sind deutlich kleiner als PNGs. Wenn Sie keine Transparenz benötigen, sparen Sie mit JPG erheblich Speicherplatz – ideal für Fotos, E-Mail-Anhänge und Social-Media-Posts.',
    },
    'tiff-zu-jpg': {
      title: 'TIFF in JPG umwandeln – Für Web und E-Mail',
      description:
        'Große TIFF-Dateien kostenlos in kompakte JPG-Bilder konvertieren. Perfekt für den Web-Upload und E-Mail-Versand.',
      cta: 'TIFF jetzt in JPG konvertieren',
      whyTitle: 'Warum TIFF zu JPG konvertieren?',
      advantage:
        'TIFF-Dateien sind für den Druck optimiert und oft sehr groß. JPG reduziert die Dateigröße massiv und ermöglicht das einfache Teilen per Web, E-Mail oder Social Media.',
    },
    'bmp-zu-webp': {
      title: 'BMP in WebP umwandeln – Massive Kompression',
      description:
        'Unkomprimierte BMP-Dateien in das moderne WebP-Format konvertieren. Drastische Größenreduktion bei hervorragender Qualität.',
      cta: 'BMP jetzt in WebP konvertieren',
      whyTitle: 'Warum BMP zu WebP konvertieren?',
      advantage:
        'BMP-Dateien sind unkomprimiert und extrem groß. WebP bietet modernste Kompression und reduziert die Dateigröße um bis zu 95% – ideal um alte BMP-Bestände webfähig zu machen.',
    },
    'gif-zu-webp': {
      title: 'GIF in WebP umwandeln – Kleiner und schärfer',
      description:
        'GIF-Dateien kostenlos in WebP konvertieren. Kleinere Dateigröße mit besserer Farbtiefe als GIF.',
      cta: 'GIF jetzt in WebP konvertieren',
      whyTitle: 'Warum GIF zu WebP konvertieren?',
      advantage:
        'WebP unterstützt mehr als 256 Farben (im Gegensatz zu GIF) und bietet bessere Kompression. Ihre Bilder sehen schärfer aus und laden schneller – ein Gewinn für jede Website.',
    },
    'heic-zu-png': {
      title: 'HEIC in PNG umwandeln – Verlustfrei konvertieren',
      description:
        'iPhone HEIC-Fotos kostenlos in das verlustfreie PNG-Format konvertieren. Maximale Qualität mit Transparenz-Unterstützung.',
      cta: 'HEIC jetzt in PNG konvertieren',
      whyTitle: 'Warum HEIC zu PNG konvertieren?',
      advantage:
        'PNG bietet verlustfreie Qualität und Transparenz. Ideal wenn Sie iPhone-Fotos weiterbearbeiten oder in der höchsten Qualität archivieren möchten.',
    },
    'webp-zu-jpg': {
      title: 'WebP in JPG umwandeln – Universelle Kompatibilität',
      description:
        'WebP-Bilder kostenlos in das universelle JPG-Format konvertieren. Für maximale Kompatibilität mit allen Geräten.',
      cta: 'WebP jetzt in JPG konvertieren',
      whyTitle: 'Warum WebP zu JPG konvertieren?',
      advantage:
        'JPG wird von jedem Gerät und Programm unterstützt. Wenn Sie WebP-Bilder in älteren Programmen, per E-Mail oder für den Druck verwenden möchten, ist JPG die sicherste Wahl.',
    },
    'svg-zu-png': {
      title: 'SVG in PNG umwandeln – Vektor zu Pixel',
      description:
        'SVG-Vektorgrafiken kostenlos in PNG-Pixelbilder konvertieren. Ideal für Social Media, Präsentationen und Druck.',
      cta: 'SVG jetzt in PNG konvertieren',
      whyTitle: 'Warum SVG zu PNG konvertieren?',
      advantage:
        'SVG ist ein Vektorformat, das nicht überall angezeigt werden kann. PNG ist universell kompatibel und ideal wenn Sie eine SVG-Grafik in fester Größe für Social Media, Präsentationen oder den Druck benötigen.',
    },
    'jpg-zu-pdf': {
      title: 'JPG in PDF umwandeln – Bilder als Dokument',
      description:
        'JPG-Bilder kostenlos in PDF-Dokumente konvertieren. Perfekt für den Druck, Bewerbungen, Archivierung und den professionellen Versand.',
      cta: 'JPG jetzt in PDF konvertieren',
      whyTitle: 'Warum JPG zu PDF konvertieren?',
      advantage:
        'PDF ist das universelle Dokumentenformat und wird auf jedem Gerät identisch angezeigt. Ideal um Fotos professionell zu versenden, zu drucken oder zu archivieren – mit garantierter Darstellung auf allen Plattformen.',
    },
    'png-zu-svg': {
      title: 'PNG in SVG umwandeln – Bild in Vektorformat',
      description:
        'PNG-Bilder kostenlos in das SVG-Format konvertieren. Erzeugt eine SVG-Datei mit eingebettetem Rasterbild – kompatibel mit allen Vektorgrafik-Programmen.',
      cta: 'PNG jetzt in SVG konvertieren',
      whyTitle: 'Warum PNG zu SVG konvertieren?',
      advantage:
        'SVG ist das Standardformat für Webgrafiken und wird von allen modernen Browsern und Designprogrammen unterstützt. Durch die Konvertierung erhalten Sie eine SVG-Datei, die Sie in Illustrator, Figma oder als Webgrafik einsetzen können.',
    },
  },
  editor: {
    toolbar: {
      upload: 'Hochladen',
      reset: 'Zurücksetzen',
      clearImage: 'Bild löschen',
      preview: 'Vorschau',
      print: 'Drucken',
      download: 'Download',
      undo: 'Rückgängig',
      redo: 'Wiederholen',
      addText: 'Text hinzufügen (T)',
      exitCollage: 'Collage-Modus beenden',
    },
    sidebar: {
      format: 'Format',
      background: 'Hintergrund',
      detach: 'Vom Hintergrund lösen',
      adjustments: 'Anpassungen',
      lightColor: 'Licht & Farbe',
      effects: 'Effekte',
      presets: 'Presets',
      resize: 'Größe ändern',
    },
    background: {
      color: 'Farbe',
      opacity: 'Deckkraft',
      hint: 'Bild laden um Hintergrund anzupassen',
    },
    detach: {
      on: 'Als freie Ebene aktiv',
      off: 'Bild vom Hintergrund lösen',
      hint: 'Löst das Bild vom Canvas und macht es zu einer eigenen Ebene.',
      hintActive: 'Das Bild ist jetzt eine frei verschieb-, skalier- und drehbare Ebene.',
      hintDisabled: 'Bild laden um es vom Hintergrund zu lösen',
      layerName: 'Bild',
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
    },
    resize: {
      width: 'Breite',
      height: 'Höhe',
      maintainAspect: 'Seitenverhältnis beibehalten',
      apply: 'Anwenden',
      presets: 'Presets',
      selectPreset: 'Preset wählen...',
      noPreset: 'Ohne Preset – Originalgröße',
    },
    canvas: {
      empty: {
        title: 'Kein Bild geladen',
        description: 'Lade ein Bild hoch um zu beginnen',
        button: 'Bild hochladen',
        uploadDesc: 'JPG, PNG, WebP, HEIC, RAW & mehr',
        dragDropTitle: 'Drag & Drop',
        dragDropDesc: 'Bild direkt hineinziehen',
        clipboardTitle: 'Aus Zwischenablage',
      },
    },
    preview: {
      before: 'Vorher',
      compare: 'Vergleich',
      after: 'Nachher',
      noOriginal: 'Kein Original verfügbar',
      noEdited: 'Keine Bearbeitung verfügbar',
      labelBefore: 'VORHER',
      labelAfter: 'NACHHER',
    },
    export: {
      quality: 'Qualität',
      transparentBackground: 'Transparenter Hintergrund',
    },
    formats: {
      png: {
        description: 'Verlustfrei, mit Transparenz',
        recommended: 'Logos, UI, Screenshots',
      },
      jpeg: {
        description: 'Komprimiert, kleine Dateigröße',
        recommended: 'Fotos, Bilder',
      },
      jpg: {
        description: 'Komprimiert, kleine Dateigröße',
        recommended: 'Fotos, Bilder',
      },
      webp: {
        description: 'Modern, effizient, klein',
        recommended: 'Web, moderne Browser',
      },
      tiff: {
        description: 'Professionelles Format',
        recommended: 'Druck, Archivierung',
      },
      tif: {
        description: 'Professionelles Format',
        recommended: 'Druck, Archivierung',
      },
      heif: {
        description: 'Modern, hohe Effizienz',
        recommended: 'Fotos (neuere Geräte)',
      },
      heic: {
        description: 'Modern, hohe Effizienz (Apple)',
        recommended: 'iOS, macOS',
      },
      gif: {
        description: 'Einzelbild GIF',
        recommended: 'Kompatibilität, Retro',
      },
      pdf: {
        description: 'Dokument, A4-Format',
        recommended: 'Dokumente, Druck',
      },
      svg: {
        description: 'Skalierbare Vektorgrafik',
        recommended: 'Logos, Icons, Webgrafiken',
      },
    },
    format: {
      backendRequired: 'Benötigt Backend-API',
      backendBadge: 'Backend',
    },
  },
  transform: {
    crop: {
      title: 'Zuschneiden',
      button: 'Zuschneiden',
      confirm: 'Bestätigen',
      cancel: 'Abbrechen',
      undo: 'Rückgängig',
      center: 'Zentrieren',
      aspectRatio: 'Seitenverhältnis',
      dimensions: 'Zuschnittabmessungen',
      dimensionsTooltip: 'Breite × Höhe des Zuschnitts in Pixel',
      width: 'Breite',
      height: 'Höhe',
      presets: {
        free: 'Frei',
        circle: 'Kreis',
      },
    },
    title: 'Transformationen',
    opacity: 'Deckkraft',
    rotation: 'Rotation',
    rotationTooltip: {
      counterClockwise: '90° gegen Uhrzeigersinn',
      rotate180: '180° drehen',
      clockwise: '90° im Uhrzeigersinn',
    },
    flip: {
      horizontal: 'Horizontal',
      vertical: 'Vertikal',
      horizontalTooltip: 'Horizontal spiegeln',
      verticalTooltip: 'Vertikal spiegeln',
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
      color: 'Farbe',
    },
    skew: {
      title: 'Neigung',
      horizontal: 'Horizontal',
      vertical: 'Vertikal',
    },
    redo: 'Wiederherstellen',
    undo: 'Rückgängig',
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
    redo: 'Wiederherstellen',
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
    style: 'Stil',
    bold: 'Fett',
    italic: 'Kursiv',
    boldInherent: 'Schriftart ist bereits fett',
    italicInherent: 'Schriftart ist bereits kursiv',
    rotation: 'Rotation',
    skewX: 'Neigung horizontal',
    skewY: 'Neigung vertikal',
    opacity: 'Deckkraft',
    strokeWidth: 'Umrandung',
    shadow: 'Schatten',
    undo: 'Rückgängig',
    redo: 'Wiederherstellen',
    delete: 'Text löschen',
    deselect: 'Auswahl aufheben',
    selectHint: 'Klicken Sie auf einen Text im Bild, um ihn zu bearbeiten',
    noTexts: 'Noch keine Texte – füge einen hinzu.',
  },
  gallery: {
    title: 'Galerie',
    subtitle: 'Verwalten Sie Ihre Bilder',
    buttons: {
      upload: 'Bilder hochladen',
      uploadFolder: 'Ordner hochladen',
      deleteAll: 'Alle Bilder löschen',
      addToEditor: 'Zum Editor hinzufügen',
      preview: 'Vorschau',
      download: 'Herunterladen',
      selectMultiple: 'Mehrfachauswahl',
      cancelSelection: 'Abbrechen',
      selectAll: 'Alle auswählen',
      deselectAll: 'Alle abwählen',
      createCollage: 'Collage erstellen',
      rename: 'Umbenennen',
    },
    errors: {
      minTwoImages: 'Bitte wählen Sie mindestens 2 Bilder aus',
      collageError: 'Fehler beim Erstellen der Collage',
    },
    empty: {
      title: 'Keine Bilder in der Galerie',
      description:
        'Nutzen Sie den "Bilder hochladen" Button oben um Ihre ersten Bilder hinzuzufügen',
    },
    imageCount: {
      single: 'Bild',
      plural: 'Bilder',
    },
    confirmDelete: 'Möchten Sie "{name}" wirklich löschen?',
    confirmDeleteAll:
      '⚠️ ACHTUNG: Möchten Sie wirklich ALLE {count} {images} aus der Galerie löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden!',
    uploadError: 'Fehler beim Hochladen von {name}',
    tooltips: {
      deleteAll: 'Alle Bilder aus der Galerie löschen',
    },
    deleteAllTitle: 'Alle Bilder löschen?',
    deleteTitle: 'Bild löschen?',
    pasteHint: 'Bilder direkt per',
    pasteHint2: 'einfügen',
    pasteShortcutHint: 'aus Zwischenablage einfügen',
  },
  about: {
    title: 'Über Bildkonverter Pro',
    subtitle: 'Schnelle und sichere Bildbearbeitung',
    mission: {
      title: 'Unsere Mission',
      description: 'Bildbearbeitung für jeden einfach und zugänglich zu machen',
    },
    privacy: {
      title: 'Datenschutz',
      description: 'Konvertierung lokal im Browser (mit notwendigen Server-Ausnahmen)',
    },
    technology: {
      title: 'Technologie',
      description: 'Moderne Web-Technologien für beste Performance',
    },
    features: {
      title: 'Funktionen',
      offline: {
        title: 'Offline-Nutzung',
        description: 'Funktioniert komplett offline',
      },
      formats: {
        title: 'Unterstützte Formate',
        description: 'PNG, JPEG, WEBP, TIFF, HEIC, RAW, GIF und PDF',
      },
      quality: {
        title: 'Hohe Qualität',
        description: 'Verlustfreie Bearbeitung möglich',
      },
      editor: {
        title: 'Vollständiger Editor',
        description: 'Filter, Anpassungen und mehr',
      },
      free: {
        title: 'Kostenlos',
        description: 'Komplett kostenlos nutzbar',
      },
    },
    techStack: {
      title: 'Technologie-Stack',
      vue: 'Modernes Vue.js Framework',
      i18n: 'Mehrsprachige Unterstützung',
      pinia: 'State Management',
      vite: 'Schnelles Build-Tool',
      scss: 'Modernes Styling',
      canvas: 'Bildverarbeitung',
    },
    version: {
      title: 'Version',
      releaseDate: 'Veröffentlicht am',
    },
    links: {
      github: 'GitHub',
      documentation: 'Dokumentation',
    },
    contact: {
      title: 'Kontakt',
      description: 'Hast du Fragen oder Feedback?',
    },
  },
  guide: {
    title: 'Benutzeranleitung',
    subtitle: 'Lernen Sie alle Funktionen des Bildkonverters kennen',
    quickStart: {
      title: 'Schnellstart',
      step1: {
        title: 'Bild hochladen',
        description:
          'Ziehen Sie ein Bild in den Editor oder klicken Sie auf "Bild hochladen", um eine Datei auszuwählen.',
      },
      step2: {
        title: 'Bild bearbeiten',
        description:
          'Nutzen Sie Filter, Anpassungen und Transformationen, um Ihr Bild nach Ihren Wünschen zu gestalten.',
      },
      step3: {
        title: 'Speichern & Herunterladen',
        description: 'Wählen Sie Ihr gewünschtes Format und laden Sie das fertige Bild herunter.',
      },
      subtitle: 'In nur drei einfachen Schritten zum perfekten Bild',
    },
    upload: {
      title: 'Bilder hochladen',
      description: 'Es gibt mehrere Wege, ein Bild in den Editor zu laden:',
      methods: {
        dragDrop: 'Ziehen Sie ein Bild direkt in den Editor (Drag & Drop)',
        fileSelect: 'Klicken Sie auf "Bild hochladen" und wählen Sie eine Datei aus',
        url: 'Laden Sie ein Bild über eine URL',
        demo: 'Verwenden Sie das Demo-Bild zum Ausprobieren',
      },
    },
    filters: {
      title: 'Filter & Anpassungen',
      description:
        'Mit den Filtern können Sie das Aussehen Ihres Bildes verändern. Alle Änderungen werden in Echtzeit angezeigt.',
      brightness: {
        title: 'Helligkeit',
        description: 'Macht das Bild heller oder dunkler',
      },
      contrast: {
        title: 'Kontrast',
        description:
          'Verstärkt oder verringert den Unterschied zwischen hellen und dunklen Bereichen',
      },
      saturation: {
        title: 'Sättigung',
        description: 'Passt die Farbintensität an - von grau bis leuchtend',
      },
      grayscale: {
        title: 'Graustufen',
        description: 'Wandelt das Bild in Schwarz-Weiß um',
      },
      sepia: {
        title: 'Sepia/Wärme',
        description: 'Verleiht dem Bild einen warmen, nostalgischen Braunton',
      },
      sharpness: {
        title: 'Schärfe',
        description: 'Macht Kanten und Details deutlicher sichtbar',
      },
    },
    presets: {
      title: 'Voreinstellungen (Presets)',
      description:
        'Wählen Sie eine fertige Voreinstellung für schnelle Bildeffekte. Sie können auch eigene Presets erstellen und speichern.',
      list: {
        original: 'Original',
        vibrant: 'Lebhaft',
        vintage: 'Vintage',
        blackWhite: 'Schwarz-Weiß',
        dramatic: 'Dramatisch',
        soft: 'Weich',
        warm: 'Warm',
        cool: 'Kühl',
      },
      tip: 'Tipp: Erstellen Sie eigene Presets, um Ihre Lieblingseinstellungen zu speichern und schnell anzuwenden.',
    },
    crop: {
      title: 'Zuschneiden',
      description:
        'Mit der Zuschneiden-Funktion können Sie einen bestimmten Bereich Ihres Bildes auswählen und den Rest entfernen.',
      steps: {
        step1: 'Klicken Sie auf den "Zuschneiden"-Button in der Werkzeugleiste',
        step2: 'Ziehen Sie mit der Maus einen Rahmen um den gewünschten Bereich',
        step3: 'Passen Sie den Rahmen bei Bedarf an',
        step4: 'Klicken Sie auf "Bestätigen", um das Bild zuzuschneiden',
      },
    },
    transform: {
      title: 'Transformationen',
      description: 'Drehen, spiegeln und zoomen Sie Ihr Bild nach Belieben.',
      rotate: {
        title: 'Drehen',
        description: 'Drehen Sie das Bild um 90° oder 180° in jede Richtung',
      },
      flip: {
        title: 'Spiegeln',
        description: 'Spiegeln Sie das Bild horizontal oder vertikal',
      },
      zoom: {
        title: 'Zoom',
        description: 'Vergrößern oder verkleinern Sie die Ansicht des Bildes',
      },
      border: {
        title: 'Rahmen & Ecken',
        description: 'Fügen Sie einen Rahmen hinzu oder runden Sie die Ecken ab',
      },
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
        shadow: 'Schatten hinzufügen',
      },
      tip: 'Tipp: Klicken Sie auf einen Text im Bild, um ihn auszuwählen und zu bearbeiten. Ziehen Sie den Text an die gewünschte Position.',
    },
    resize: {
      title: 'Größe ändern',
      description: 'Ändern Sie die Abmessungen Ihres Bildes.',
      features: {
        custom: 'Geben Sie Breite und Höhe manuell ein',
        aspectRatio: 'Seitenverhältnis beibehalten für proportionale Größenänderung',
        presets: 'Wählen Sie aus vordefinierten Größen für Social Media und Web',
      },
    },
    export: {
      title: 'Exportieren & Herunterladen',
      description: 'Speichern Sie Ihr bearbeitetes Bild in verschiedenen Formaten.',
      steps: {
        step1: 'Klicken Sie auf den "Download"-Button',
        step2: 'Wählen Sie das gewünschte Dateiformat',
        step3: 'Das Bild wird automatisch heruntergeladen',
      },
      formatsTitle: 'Verfügbare Exportformate',
    },
    gallery: {
      title: 'Galerie',
      description: 'In der Galerie können Sie mehrere Bilder speichern und verwalten.',
      features: {
        upload: 'Laden Sie mehrere Bilder auf einmal hoch',
        preview: 'Zeigen Sie Bilder in einer Vorschau an',
        openEditor: 'Öffnen Sie ein Bild direkt im Editor zur Bearbeitung',
        download: 'Laden Sie Bilder einzeln herunter',
        delete: 'Löschen Sie nicht mehr benötigte Bilder',
      },
    },
    collage: {
      title: 'Collage & Ebenen',
      description:
        'Im Collage-Modus können Sie mehrere Bilder übereinander platzieren und eine kreative Komposition erstellen.',
      features: {
        addLayer: 'Weitere Bilder als Ebenen hinzufügen',
        drag: 'Ebenen frei auf der Leinwand positionieren',
        resize: 'Größe jeder Ebene unabhängig anpassen',
        order: 'Reihenfolge der Ebenen ändern',
        background: 'Hintergrundfarbe der Leinwand wählen',
        merge: 'Alle Ebenen zum fertigen Bild zusammenfügen',
      },
      tip: 'Tipp: Aktivieren Sie den Collage-Modus über den Button in der Editor-Toolbar.',
    },
    mobile: {
      title: 'Mobile Bedienung',
      description:
        'Der Editor ist vollständig für Touch-Geräte optimiert – alle Funktionen sind auch auf Smartphones und Tablets verfügbar.',
      gestures: {
        title: 'Touch-Gesten',
        pinch: 'Zwei Finger zum Zoomen spreizen oder zusammenführen',
        drag: 'Mit einem Finger das Bild verschieben',
        doubleTap: 'Doppel-Tap auf Text zum Bearbeiten',
        longPress: 'Langer Druck öffnet Bearbeitungsoptionen',
        tap: 'Auf Text tippen, um ihn auszuwählen',
      },
    },
    batch: {
      title: 'Stapelverarbeitung',
      description:
        'Mit der Stapelverarbeitung können Sie mehrere Bilder gleichzeitig konvertieren und herunterladen – ohne jedes Bild einzeln bearbeiten zu müssen.',
      features: {
        multiUpload: 'Mehrere Bilder auf einmal hochladen',
        formatConvert: 'Alle Bilder in ein Format konvertieren',
        qualitySet: 'Qualität und Größe für alle Bilder festlegen',
        zipDownload: 'Ergebnisse als ZIP-Datei herunterladen',
      },
      link: 'Zur Stapelverarbeitung',
    },
    privacy: {
      title: 'Datenschutz & lokale Verarbeitung',
      description:
        'Alle Bildbearbeitungen erfolgen direkt in Ihrem Browser – keine Bilder werden auf Server hochgeladen. Ihre Daten bleiben jederzeit auf Ihrem Gerät.',
      features: {
        local: 'Vollständig lokale Verarbeitung im Browser',
        noUpload: 'Keine Uploads auf externe Server',
        noAccount: 'Kein Konto oder Login erforderlich',
        offline: 'Funktioniert auch offline nach dem ersten Laden',
      },
    },
    history: {
      title: 'Verlauf (Rückgängig/Wiederholen)',
      description:
        'Alle Ihre Bearbeitungsschritte werden gespeichert. Sie können jederzeit Änderungen rückgängig machen oder wiederherstellen.',
      undo: 'Rückgängig',
      redo: 'Wiederholen',
      shortcuts: {
        addText: 'Text hinzufügen',
        escape: 'Auswahl aufheben / Abbrechen',
        delete: 'Ausgewähltes Element löschen',
        pasteImage: 'Bild aus Zwischenablage einfügen',
      },
    },
    settings: {
      title: 'Einstellungen',
      description: 'Passen Sie die Anwendung an Ihre Bedürfnisse an.',
      features: {
        language: 'Sprache wechseln (Deutsch/Englisch)',
        theme: 'Zwischen hellem und dunklem Design wechseln',
      },
    },
    cta: {
      title: 'Bereit zum Loslegen?',
      description: 'Öffnen Sie jetzt den Editor und beginnen Sie mit der Bearbeitung Ihrer Bilder!',
      button: 'Zum Editor',
    },
    badge: 'Benutzerhandbuch',
  },
  filters: {
    brightness: 'Helligkeit',
    contrast: 'Kontrast',
    saturation: 'Sättigung',
    grayscale: 'Graustufen',
    sepia: 'Sepia',
    blur: 'Weichzeichner',
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
      delete: 'Löschen',
    },
    dialogs: {
      saveName: 'Preset-Name:',
      defaultName: 'Mein Preset',
      saveDescription: 'Beschreibung (optional):',
      confirmDelete: 'Möchten Sie dieses Preset wirklich löschen?',
      deleteTitle: 'Preset löschen?',
    },
    errors: {
      invalidFormat: 'Ungültiges Dateiformat',
    },
    noir: 'Noir',
    dreamy: 'Verträumt',
  },
  shortcuts: {
    title: 'Tastaturkürzel',
    close: 'Schließen',
    groups: {
      general: 'Allgemein',
      navigation: 'Navigation',
      editor: 'Editor',
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
      reset: 'Zurücksetzen',
    },
  },
  common: {
    cancel: 'Abbrechen',
    reset: 'Zurücksetzen',
    increase: 'Erhöhen',
    decrease: 'Verringern',
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
      undoSuccess: 'Original-Bild wiederhergestellt',
      cancelled: 'Zuschneiden abgebrochen',
    },
    editor: {
      printFailed: 'Drucken fehlgeschlagen',
      imageDeleted: 'Bild erfolgreich gelöscht',
      galleryLoaded: 'Bild aus Galerie geladen',
      galleryError: 'Fehler beim Laden aus Galerie',
      resizeSuccess: 'Bildgröße erfolgreich geändert: {width}×{height}px',
      resizeInvalid: 'Ungültige Bildgröße – bitte Werte zwischen 1 und {max} px eingeben',
      imageReset: 'Bild auf Originalzustand zurückgesetzt',
      exporting: 'Exportiere...',
      imageDetached: 'Bild vom Hintergrund gelöst – jetzt frei verschiebbar',
      imageReattached: 'Bild wieder mit dem Hintergrund verbunden',
      detachFailed: 'Ablösen fehlgeschlagen',
      reattachFailed: 'Verbinden fehlgeschlagen',
    },
    presets: {
      applied: 'Preset "{name}" angewendet',
      saved: 'Preset "{name}" gespeichert',
      deleted: 'Preset "{name}" gelöscht',
      exported: '{count} Preset(s) exportiert',
      imported: '{count} Preset(s) importiert',
      noCustomPresets: 'Keine benutzerdefinierten Presets vorhanden',
      importError: 'Fehler beim Importieren',
    },
    transform: {
      rotated90: 'Bild um 90° gedreht',
      rotated180: 'Bild um 180° gedreht',
      flippedHorizontal: 'Bild horizontal gespiegelt',
      flippedVertical: 'Bild vertikal gespiegelt',
      panReset: 'Bildausschnitt zurückgesetzt',
      rotationReset: 'Rotation zurückgesetzt',
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
      fileRemoved: '„{name}" entfernt',
      zipCreating: 'ZIP-Datei wird erstellt...',
      zipDownloaded: 'ZIP-Datei heruntergeladen',
      conversionReset: 'Konvertierung zurückgesetzt – Bilder bleiben erhalten',
    },
    conversion: {
      success: '{from} erfolgreich in {to} konvertiert',
      error: 'Konvertierung fehlgeschlagen: {error}',
      downloadStarted: '{filename} wird heruntergeladen',
      uploadReceived: 'Bild empfangen – Konvertierung läuft...',
    },
    network: {
      online: 'Verbindung wiederhergestellt',
      offline: 'Keine Verbindung – du arbeitest offline',
    },
    text: {
      saveError: 'Fehler beim Speichern des Textes',
      deleteError: 'Fehler beim Löschen des Textes',
    },
    gallery: {
      pasted: 'Bild aus Zwischenablage hinzugefügt',
    },
  },
  confirm: {
    cancel: 'Abbrechen',
    delete: 'Löschen',
    reset: 'Zurücksetzen',
    editor: {
      resetTitle: 'Alle Änderungen verwerfen?',
      resetMessage:
        'Das Bild wird auf den Originalzustand zurückgesetzt. Alle Filter, Texte, Zuschnitte und Transformationen gehen verloren.',
      clearTitle: 'Bild entfernen?',
      clearMessage: 'Möchten Sie das Bild wirklich entfernen? Alle Änderungen gehen verloren.',
      clearCollageMessage:
        'Möchten Sie die Collage wirklich entfernen? Alle Layer und Änderungen gehen verloren.',
    },
  },
  layerPanel: {
    tabs: {
      layers: 'Ebenen',
      text: 'Text',
    },
    history: {
      undo: 'Rückgängig (Strg+Z)',
      redo: 'Wiederholen (Strg+Y)',
      preview: 'Vorschau',
    },
    layers: {
      title: 'Ebenen',
      hide: 'Ausblenden',
      show: 'Einblenden',
      delete: 'Löschen',
      moveUp: 'Nach oben',
      moveDown: 'Nach unten',
      duplicate: 'Duplizieren',
      confirmDelete: 'Möchten Sie diesen Layer wirklich löschen?',
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
      blue: 'Blau',
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
      opacity: 'Deckkraft',
    },
    filters: {
      title: 'Filter',
      brightness: 'Helligkeit',
      contrast: 'Kontrast',
      saturation: 'Sättigung',
      grayscale: 'Graustufen',
      reset: 'Filter zurücksetzen',
    },
    border: {
      title: 'Umrandung',
      width: 'Randstärke',
      color: 'Randfarbe',
      radius: 'Eckenradius',
    },
    shadow: {
      title: 'Schlagschatten',
      enable: 'Schatten aktivieren',
      offsetX: 'Versatz X',
      offsetY: 'Versatz Y',
      blur: 'Unschärfe',
      color: 'Schattenfarbe',
      opacity: 'Deckkraft',
    },
    hints: {
      selectLayer: 'Klicken Sie auf ein Bild im Canvas um es zu bearbeiten',
      addText: 'Klicken Sie auf "Text hinzufügen" um einen neuen Text zu erstellen',
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
      newText: 'Neuer Text',
    },
  },
  batch: {
    title: 'Batch-Konvertierung',
    subtitle: 'Konvertieren Sie mehrere Bilder gleichzeitig in das gewünschte Format',
    upload: {
      title: 'Bilder hochladen',
      description: 'Ziehen Sie Ihre Bilder hierher oder klicken Sie zum Auswählen',
      hint: 'JPG, PNG, WebP, GIF, BMP, TIFF, HEIC, RAW (CR2, NEF, ARW, DNG …) und mehr',
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
      prefixPlaceholder: 'z.B. konvertiert_',
      pdfMode: 'PDF-Modus',
      pdfModeSingle: 'Jedes Bild als einzelne PDF',
      pdfModeMerged: 'Alle Bilder in eine gemeinsame PDF',
    },
    processing: 'Wird konvertiert...',
    start: 'Konvertierung starten',
    reconvert: 'Erneut konvertieren',
    downloadAll: 'Alle herunterladen',
    downloadZip: 'Als ZIP herunterladen',
    clearAll: 'Alle entfernen',
    resetConversion: 'Konvertierung zurücksetzen',
    mergedPdfFilename: 'Zusammengefügt',
    files: {
      title: 'Dateien',
      download: 'Herunterladen',
      preview: 'Vorschau',
    },
    preview: {
      original: 'Original',
      processed: 'Konvertiert',
    },
    confirmClear: 'Möchten Sie wirklich alle Dateien entfernen?',
    clearAllTitle: 'Alle Dateien entfernen?',
  },
  notFound: {
    title: 'Seite nicht gefunden',
    description:
      'Die angeforderte Seite existiert nicht. Möglicherweise wurde sie verschoben oder gelöscht.',
    backHome: 'Zur Startseite',
  },
  handoff: {
    title: '{count} Bild(er) bereit zur Uebernahme',
    from: 'Aus {tool} uebertragen',
    accept: 'Bilder uebernehmen',
    dismiss: 'Verwerfen',
    forwardTitle: 'Download gestartet!',
    forwardText: 'Moechtest du mit deinem Bild direkt in einem anderen Kodini-Tool weiterarbeiten?',
    forwardColorExtractor: 'Farben extrahieren',
    forwardColorExtractorHint: 'Farbpalette aus dem Bild gewinnen',
    forwardVisualizer: 'Im Visualizer nutzen',
    forwardVisualizerHint: 'Als Hintergrund im Audio-Visualizer verwenden',
    forwardDismiss: 'Nein danke',
  },
};
