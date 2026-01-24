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
    }
  },
  transform: {
    crop: {
      title: 'Zuschneiden',
      button: 'Zuschneiden',
      confirm: 'Bestätigen',
      undo: 'Rückgängig'
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
    border: 'Rahmen',
    borderColor: 'Farbe',
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
    cancel: 'Abbrechen'
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
      openInEditor: 'Im Editor öffnen'
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
    }
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
    }
  },
  transform: {
    crop: {
      title: 'Crop',
      button: 'Crop',
      confirm: 'Confirm',
      undo: 'Undo'
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
    border: 'Border',
    borderColor: 'Color',
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
    cancel: 'Cancel'
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
      openInEditor: 'Open in Editor'
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
    }
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
