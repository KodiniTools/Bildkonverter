/**
 * Englische Übersetzungen (en)
 *
 * Alle Schlüssel werden in der App referenziert – als Literal, über Datenarrays
 * (z.B. Guide-Features) oder über Template-Präfixe wie `guide.filters.${key}`.
 */

export default {
  nav: {
    home: 'Home',
    editor: 'Editor',
    gallery: 'Gallery',
    guide: 'Guide',
    about: 'About',
    faq: 'FAQ',
    blog: 'Blog',
  },
  locale: 'en-US',
  home: {
    title: 'Welcome to Image Converter Pro',
    subtitle:
      'Fast and secure image editing mostly local in your browser, specialized formats securely on German server',
    startEditing: 'Start Editing',
    heroAlt: 'Image Converter Pro - Online image editing and format conversion',
    features: {
      title: 'Features',
      convert: {
        title: 'Format Conversion',
        description: 'Convert images between JPG, PNG, WebP, GIF and more',
      },
      edit: {
        title: 'Image Editing',
        description: 'Real-time filters, adjustments and effects',
      },
      compress: {
        title: 'Compression',
        description: 'Reduce file size without quality loss',
      },
      privacy: {
        title: 'Privacy',
        description: 'Conversion locally in your browser (with necessary server exceptions)',
      },
      fast: {
        title: 'Fast',
        description: 'Instant processing without upload',
      },
      crop: {
        title: 'Crop Images',
        description:
          'Crop your images precisely and focus on what matters. Perfect for social media and websites.',
      },
    },
    batchLink: 'convert multiple images',
    conversions: {
      title: 'Popular Conversions',
      subtitle: 'Choose your desired format – fast, free and directly in your browser',
    },
    moreTools: {
      title: 'More Image Tools by KodiniTools',
      subtitle: 'Discover our free online tools for image editing',
      batchEditor: {
        title: 'Batch Image Editor',
        description:
          'Edit entire image series at once – resize, crop and apply filters in batch mode.',
      },
      collageMaker: {
        title: 'Collage Maker',
        description:
          'Create stunning photo collages from your images – with flexible layouts and customizations.',
      },
      colorExtractor: {
        title: 'Color Extractor',
        description:
          'Extract color palettes from images – perfect for designers, web developers and creative projects.',
      },
      cta: 'Try it now',
    },
    webpPromo: {
      title: 'Why WebP? Improve your Google PageSpeed ranking!',
      description:
        'WebP offers up to 30% smaller files than PNG and JPG at the same quality. Google recommends WebP for faster loading times – a direct ranking factor for SEO.',
      cta: 'Convert to WebP now',
    },
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about our image editor',
    items: {
      formats: {
        question: 'Which image formats are supported?',
        answer:
          'Our editor supports PNG, JPEG, WEBP, TIFF, HEIC/HEIF, GIF, and PDF. Camera RAW formats (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2, PEF) are also supported – processing is done server-side.',
      },
      privacy: {
        question: 'Are my images safe and private?',
        answer:
          'Yes, absolutely. Protecting your data is our top priority. To be transparent, the exact process depends on the file format you choose:\n\nFor most formats: When you convert common formats like JPG, PNG, WEBP, and PDF, all processing happens 100% locally in your web browser. Your images never leave your device. This is the fastest and most private method we offer for the majority of our formats.\n\nFor specialized formats: For complex formats like TIFF, GIF, and HAIC, server-side processing on our servers is necessary, as browsers cannot (yet) perform these conversions locally.\n\nOur privacy promise for this server processing:\n1. Secure upload: Your file is transferred to our server with SSL encryption.\n2. Location Germany: Our server is located in Germany and operates strictly according to GDPR regulations.\n3. No storage: Your file is used exclusively for the automated conversion process and permanently deleted immediately (at the latest within 15 minutes) after successful conversion.\n4. No inspection: Neither the original nor the converted file is stored, analyzed, or viewed by us.',
      },
      filters: {
        question: 'What filters and adjustments can I make?',
        answer:
          'You can adjust brightness, contrast, saturation, blur, and hue. Additionally, we offer pre-made presets like Grayscale, Sepia, Vintage, and more for quick style changes.',
      },
      crop: {
        question: 'Can I crop and resize images?',
        answer:
          'Yes, you can precisely crop images and adjust their size. Use the crop function to select the desired area, and the resize options to change width and height while maintaining aspect ratio.',
      },
      resize: {
        question: 'Can I rotate and flip images?',
        answer:
          'Of course! You can rotate images by 90° or 180°, flip horizontally or vertically, and even perform custom rotations with precise degree input.',
      },
      download: {
        question: 'How do I save my edited image?',
        answer:
          'Simply click the download button in the toolbar. You can choose the image format and the edited image will be downloaded directly to your device. No account required!',
      },
    },
  },
  conversion: {
    batchCta: 'Convert multiple images',
    widget: {
      dropHint: 'Drop file here or click to select',
      converting: 'Converting...',
      download: 'Download',
      convertAnother: 'Convert another image',
      tryAgain: 'Try again',
    },
    benefits: {
      fast: {
        title: 'Lightning Fast',
        description: 'Conversion in seconds, right in your browser.',
      },
      privacy: {
        title: 'GDPR Compliant',
        description: 'Your images are processed locally. No upload needed.',
      },
      quality: {
        title: 'Best Quality',
        description: 'Choose the quality level – from maximum compression to lossless.',
      },
    },
    howTo: {
      title: 'How it works',
      step1: {
        title: 'Upload image',
        description: 'Drag your image into the editor or click the upload button.',
      },
      step2: {
        title: 'Choose format',
        description: 'Select the desired target format and quality level.',
      },
      step3: {
        title: 'Download',
        description: 'Click download and your converted image will be saved instantly.',
      },
    },
    otherFormats: {
      title: 'More conversions',
    },
    formats: {
      heic: {
        info: 'Apple format for iPhone photos. High quality at small file size, but limited compatibility.',
      },
      jpg: {
        info: 'The most universal image format. Ideal for photos and web content with adjustable compression.',
      },
      png: {
        info: 'Lossless format with transparency support. Perfect for graphics, logos and screenshots.',
      },
      webp: {
        info: 'Modern Google format. Up to 30% smaller than JPG/PNG at the same quality – ideal for web performance.',
      },
      tiff: {
        info: 'Professional print format. Lossless with high color depth – industry standard for print.',
      },
      gif: {
        info: 'Supports animations and simple graphics with up to 256 colors.',
      },
      bmp: {
        info: 'Uncompressed Windows bitmap format. High quality, but large file size.',
      },
      svg: {
        info: 'Vector-based format. Infinitely scalable without quality loss – ideal for logos and icons.',
      },
      pdf: {
        info: 'Universal document format. Ideal for printing, archiving and sharing images as documents.',
      },
    },
    'heic-zu-jpg': {
      title: 'Convert HEIC to JPG – Fast & Free',
      description:
        'Easily convert iPhone photos in HEIC format to JPG for free. Directly in your browser, without uploading to external servers.',
      cta: 'Convert HEIC to JPG now',
      whyTitle: 'Why convert HEIC to JPG?',
      advantage:
        'JPG is the most universal image format, supported by all devices, browsers and programs. HEIC files from iPhones are often not directly compatible – converting to JPG solves this problem instantly.',
    },
    'png-zu-webp': {
      title: 'Convert PNG to WebP – For Faster Websites',
      description:
        'Convert PNG files to the modern WebP format for free. Up to 30% smaller files at the same quality – perfect for web performance and SEO.',
      cta: 'Convert PNG to WebP now',
      whyTitle: 'Why convert PNG to WebP?',
      advantage:
        'WebP offers significantly smaller file sizes than PNG at comparable quality and also supports transparency. Google recommends WebP for faster loading times, which directly improves PageSpeed rankings.',
    },
    'jpg-zu-webp': {
      title: 'Convert JPG to WebP – Web Optimization',
      description:
        'Convert JPG images to WebP for free. State-of-the-art compression for faster loading times and better Google PageSpeed ranking.',
      cta: 'Convert JPG to WebP now',
      whyTitle: 'Why convert JPG to WebP?',
      advantage:
        'WebP compresses images more efficiently than JPG and is supported by all modern browsers. By switching to WebP, you improve your website loading time – an important ranking factor for Google.',
    },
    'webp-zu-png': {
      title: 'Convert WebP to PNG – For Maximum Compatibility',
      description:
        'Convert WebP files to PNG for free. Lossless quality with universal compatibility.',
      cta: 'Convert WebP to PNG now',
      whyTitle: 'Why convert WebP to PNG?',
      advantage:
        "PNG offers maximum compatibility with all image editing programs and older systems. If you want to use a WebP image for printing or in programs that don't support WebP, PNG is the best choice.",
    },
    'jpg-zu-png': {
      title: 'Convert JPG to PNG – For Transparency and Quality',
      description:
        'Convert JPG images to PNG for free and losslessly. Ideal when you need transparency or want to avoid quality loss.',
      cta: 'Convert JPG to PNG now',
      whyTitle: 'Why convert JPG to PNG?',
      advantage:
        'PNG supports transparency and lossless compression. Ideal when you want to further edit images, remove backgrounds, or create graphics with sharp edges.',
    },
    'png-zu-jpg': {
      title: 'Convert PNG to JPG – Reduce File Size',
      description:
        'Convert PNG files to JPG for free. Significantly reduce file size – ideal for email and social media.',
      cta: 'Convert PNG to JPG now',
      whyTitle: 'Why convert PNG to JPG?',
      advantage:
        "JPG files are significantly smaller than PNGs. If you don't need transparency, you save considerable storage space with JPG – ideal for photos, email attachments and social media posts.",
    },
    'tiff-zu-jpg': {
      title: 'Convert TIFF to JPG – For Web and Email',
      description:
        'Convert large TIFF files to compact JPG images for free. Perfect for web uploads and email.',
      cta: 'Convert TIFF to JPG now',
      whyTitle: 'Why convert TIFF to JPG?',
      advantage:
        'TIFF files are optimized for print and often very large. JPG massively reduces the file size and enables easy sharing via web, email or social media.',
    },
    'bmp-zu-webp': {
      title: 'Convert BMP to WebP – Massive Compression',
      description:
        'Convert uncompressed BMP files to the modern WebP format. Drastic size reduction with excellent quality.',
      cta: 'Convert BMP to WebP now',
      whyTitle: 'Why convert BMP to WebP?',
      advantage:
        'BMP files are uncompressed and extremely large. WebP offers state-of-the-art compression and reduces file size by up to 95% – ideal for making old BMP archives web-ready.',
    },
    'gif-zu-webp': {
      title: 'Convert GIF to WebP – Smaller and Sharper',
      description:
        'Convert GIF files to WebP for free. Smaller file size with better color depth than GIF.',
      cta: 'Convert GIF to WebP now',
      whyTitle: 'Why convert GIF to WebP?',
      advantage:
        'WebP supports more than 256 colors (unlike GIF) and offers better compression. Your images look sharper and load faster – a win for any website.',
    },
    'heic-zu-png': {
      title: 'Convert HEIC to PNG – Lossless Conversion',
      description:
        'Convert iPhone HEIC photos to the lossless PNG format for free. Maximum quality with transparency support.',
      cta: 'Convert HEIC to PNG now',
      whyTitle: 'Why convert HEIC to PNG?',
      advantage:
        'PNG offers lossless quality and transparency. Ideal when you want to further edit iPhone photos or archive them at the highest quality.',
    },
    'webp-zu-jpg': {
      title: 'Convert WebP to JPG – Universal Compatibility',
      description:
        'Convert WebP images to the universal JPG format for free. For maximum compatibility with all devices.',
      cta: 'Convert WebP to JPG now',
      whyTitle: 'Why convert WebP to JPG?',
      advantage:
        'JPG is supported by every device and program. If you want to use WebP images in older programs, via email or for print, JPG is the safest choice.',
    },
    'svg-zu-png': {
      title: 'Convert SVG to PNG – Vector to Pixel',
      description:
        'Convert SVG vector graphics to PNG pixel images for free. Ideal for social media, presentations and print.',
      cta: 'Convert SVG to PNG now',
      whyTitle: 'Why convert SVG to PNG?',
      advantage:
        'SVG is a vector format that cannot be displayed everywhere. PNG is universally compatible and ideal when you need an SVG graphic in a fixed size for social media, presentations or print.',
    },
    'jpg-zu-pdf': {
      title: 'Convert JPG to PDF – Images as Documents',
      description:
        'Convert JPG images to PDF documents for free. Perfect for printing, applications, archiving and professional sharing.',
      cta: 'Convert JPG to PDF now',
      whyTitle: 'Why convert JPG to PDF?',
      advantage:
        'PDF is the universal document format and displays identically on every device. Ideal for sending photos professionally, printing or archiving – with guaranteed display across all platforms.',
    },
    'png-zu-svg': {
      title: 'Convert PNG to SVG – Image to Vector Format',
      description:
        'Convert PNG images to SVG format for free. Creates an SVG file with embedded raster image – compatible with all vector graphics editors.',
      cta: 'Convert PNG to SVG now',
      whyTitle: 'Why convert PNG to SVG?',
      advantage:
        'SVG is the standard format for web graphics and is supported by all modern browsers and design tools. The conversion produces an SVG file you can use in Illustrator, Figma or as a web graphic.',
    },
  },
  editor: {
    toolbar: {
      upload: 'Upload',
      reset: 'Reset',
      clearImage: 'Clear Image',
      preview: 'Preview',
      print: 'Print',
      download: 'Download',
      undo: 'Undo',
      redo: 'Redo',
      addText: 'Add text (T)',
      exitCollage: 'Exit collage mode',
    },
    sidebar: {
      format: 'Format',
      background: 'Background',
      detach: 'Detach from background',
      adjustments: 'Adjustments',
      lightColor: 'Light & Color',
      effects: 'Effects',
      presets: 'Presets',
      resize: 'Resize',
    },
    background: {
      color: 'Color',
      opacity: 'Opacity',
      hint: 'Load an image to adjust background',
    },
    detach: {
      on: 'Active as a free layer',
      off: 'Detach image from background',
      hint: 'Detaches the image from the canvas and turns it into its own layer.',
      hintActive: 'The image is now a freely movable, resizable and rotatable layer.',
      hintDisabled: 'Load an image to detach it from the background',
      layerName: 'Image',
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
    },
    resize: {
      width: 'Width',
      height: 'Height',
      maintainAspect: 'Maintain Aspect Ratio',
      apply: 'Apply',
      presets: 'Presets',
      selectPreset: 'Select preset...',
      noPreset: 'No preset – original size',
    },
    canvas: {
      empty: {
        title: 'No Image Loaded',
        description: 'Upload an image to get started',
        button: 'Upload Image',
        uploadDesc: 'JPG, PNG, WebP, HEIC, RAW & more',
        dragDropTitle: 'Drag & Drop',
        dragDropDesc: 'Drop image here',
        clipboardTitle: 'From Clipboard',
      },
    },
    preview: {
      before: 'Before',
      compare: 'Compare',
      after: 'After',
      noOriginal: 'No original available',
      noEdited: 'No edits available',
      labelBefore: 'BEFORE',
      labelAfter: 'AFTER',
    },
    export: {
      quality: 'Quality',
      transparentBackground: 'Transparent background',
    },
    formats: {
      png: {
        description: 'Lossless, with transparency',
        recommended: 'Logos, UI, Screenshots',
      },
      jpeg: {
        description: 'Lossy, small file size',
        recommended: 'Photos, Images',
      },
      jpg: {
        description: 'Lossy, small file size',
        recommended: 'Photos, Images',
      },
      webp: {
        description: 'Modern, efficient, small',
        recommended: 'Web, modern browsers',
      },
      tiff: {
        description: 'Professional format',
        recommended: 'Print, Archiving',
      },
      tif: {
        description: 'Professional format',
        recommended: 'Print, Archiving',
      },
      heif: {
        description: 'Modern, high efficiency',
        recommended: 'Photos (newer devices)',
      },
      heic: {
        description: 'Modern, high efficiency (Apple)',
        recommended: 'iOS, macOS',
      },
      gif: {
        description: 'Single-frame GIF',
        recommended: 'Compatibility, Retro',
      },
      pdf: {
        description: 'Document, A4 format',
        recommended: 'Documents, Print',
      },
      svg: {
        description: 'Scalable Vector Graphics',
        recommended: 'Logos, Icons, Web Graphics',
      },
    },
    format: {
      backendRequired: 'Requires backend API',
      backendBadge: 'Backend',
    },
  },
  transform: {
    crop: {
      title: 'Crop',
      button: 'Crop',
      confirm: 'Confirm',
      cancel: 'Cancel',
      undo: 'Undo',
      center: 'Center',
      aspectRatio: 'Aspect Ratio',
      dimensions: 'Crop Size',
      dimensionsTooltip: 'Width × height of the crop area in pixels',
      width: 'Width',
      height: 'Height',
      presets: {
        free: 'Free',
        circle: 'Circle',
      },
    },
    title: 'Transformations',
    opacity: 'Opacity',
    rotation: 'Rotation',
    rotationTooltip: {
      counterClockwise: '90° counter-clockwise',
      rotate180: 'Rotate 180°',
      clockwise: '90° clockwise',
    },
    flip: {
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      horizontalTooltip: 'Flip horizontally',
      verticalTooltip: 'Flip vertically',
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
      color: 'Color',
    },
    skew: {
      title: 'Skew',
      horizontal: 'Horizontal',
      vertical: 'Vertical',
    },
    redo: 'Redo',
    undo: 'Undo',
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
    redo: 'Redo',
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
    style: 'Style',
    bold: 'Bold',
    italic: 'Italic',
    boldInherent: 'Font is already bold',
    italicInherent: 'Font is already italic',
    rotation: 'Rotation',
    skewX: 'Skew horizontal',
    skewY: 'Skew vertical',
    opacity: 'Opacity',
    strokeWidth: 'Stroke',
    shadow: 'Shadow',
    undo: 'Undo',
    redo: 'Redo',
    delete: 'Delete Text',
    deselect: 'Deselect',
    selectHint: 'Click on a text in the image to edit it',
    noTexts: 'No texts yet – add one.',
  },
  gallery: {
    title: 'Gallery',
    subtitle: 'Manage Your Images',
    buttons: {
      upload: 'Upload Images',
      uploadFolder: 'Upload Folder',
      deleteAll: 'Delete All Images',
      addToEditor: 'Add to Editor',
      preview: 'Preview',
      download: 'Download',
      selectMultiple: 'Multi-Select',
      cancelSelection: 'Cancel',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      createCollage: 'Create Collage',
      rename: 'Rename',
    },
    errors: {
      minTwoImages: 'Please select at least 2 images',
      collageError: 'Error creating collage',
    },
    empty: {
      title: 'No Images in Gallery',
      description: 'Use the "Upload Images" button above to add your first images',
    },
    imageCount: {
      single: 'Image',
      plural: 'Images',
    },
    confirmDelete: 'Do you really want to delete "{name}"?',
    confirmDeleteAll:
      '⚠️ WARNING: Do you really want to delete ALL {count} {images} from the gallery?\n\nThis action cannot be undone!',
    uploadError: 'Error uploading {name}',
    tooltips: {
      deleteAll: 'Delete all images from the gallery',
    },
    deleteAllTitle: 'Delete all images?',
    deleteTitle: 'Delete image?',
    pasteHint: 'Paste images directly with',
    pasteHint2: '',
    pasteShortcutHint: 'to paste from clipboard',
  },
  about: {
    title: 'About Image Converter Pro',
    subtitle: 'Fast and secure image editing',
    mission: {
      title: 'Our Mission',
      description: 'Making image editing simple and accessible for everyone',
    },
    privacy: {
      title: 'Privacy',
      description: 'Conversion locally in your browser (with necessary server exceptions)',
    },
    technology: {
      title: 'Technology',
      description: 'Modern web technologies for best performance',
    },
    features: {
      title: 'Features',
      offline: {
        title: 'Offline Usage',
        description: 'Works completely offline',
      },
      formats: {
        title: 'Supported Formats',
        description: 'PNG, JPEG, WEBP, TIFF, HEIC, RAW, GIF, and PDF',
      },
      quality: {
        title: 'High Quality',
        description: 'Lossless editing possible',
      },
      editor: {
        title: 'Full Editor',
        description: 'Filters, adjustments and more',
      },
      free: {
        title: 'Free',
        description: 'Completely free to use',
      },
    },
    techStack: {
      title: 'Technology Stack',
      vue: 'Modern Vue.js Framework',
      i18n: 'Multi-language Support',
      pinia: 'State Management',
      vite: 'Fast Build Tool',
      scss: 'Modern Styling',
      canvas: 'Image Processing',
    },
    version: {
      title: 'Version',
      releaseDate: 'Released on',
    },
    links: {
      github: 'GitHub',
      documentation: 'Documentation',
    },
    contact: {
      title: 'Contact',
      description: 'Have questions or feedback?',
    },
  },
  guide: {
    title: 'User Guide',
    subtitle: 'Learn all the features of the Image Converter',
    quickStart: {
      title: 'Quick Start',
      step1: {
        title: 'Upload Image',
        description: 'Drag an image into the editor or click "Upload Image" to select a file.',
      },
      step2: {
        title: 'Edit Image',
        description: 'Use filters, adjustments, and transformations to customize your image.',
      },
      step3: {
        title: 'Save & Download',
        description: 'Choose your desired format and download the finished image.',
      },
      subtitle: 'The perfect image in just three easy steps',
    },
    upload: {
      title: 'Upload Images',
      description: 'There are several ways to load an image into the editor:',
      methods: {
        dragDrop: 'Drag an image directly into the editor (Drag & Drop)',
        fileSelect: 'Click "Upload Image" and select a file',
        url: 'Load an image via URL',
        demo: 'Use the demo image to try out',
      },
    },
    filters: {
      title: 'Filters & Adjustments',
      description:
        'Use filters to change the appearance of your image. All changes are displayed in real-time.',
      brightness: {
        title: 'Brightness',
        description: 'Makes the image brighter or darker',
      },
      contrast: {
        title: 'Contrast',
        description: 'Increases or decreases the difference between light and dark areas',
      },
      saturation: {
        title: 'Saturation',
        description: 'Adjusts color intensity - from gray to vibrant',
      },
      grayscale: {
        title: 'Grayscale',
        description: 'Converts the image to black and white',
      },
      sepia: {
        title: 'Sepia/Warmth',
        description: 'Gives the image a warm, nostalgic brown tone',
      },
      sharpness: {
        title: 'Sharpness',
        description: 'Makes edges and details more visible',
      },
    },
    presets: {
      title: 'Presets',
      description:
        'Choose a ready-made preset for quick image effects. You can also create and save your own presets.',
      list: {
        original: 'Original',
        vibrant: 'Vibrant',
        vintage: 'Vintage',
        blackWhite: 'Black & White',
        dramatic: 'Dramatic',
        soft: 'Soft',
        warm: 'Warm',
        cool: 'Cool',
      },
      tip: 'Tip: Create your own presets to save your favorite settings and apply them quickly.',
    },
    crop: {
      title: 'Crop',
      description:
        'Use the crop function to select a specific area of your image and remove the rest.',
      steps: {
        step1: 'Click the "Crop" button in the toolbar',
        step2: 'Draw a frame around the desired area with your mouse',
        step3: 'Adjust the frame if needed',
        step4: 'Click "Confirm" to crop the image',
      },
    },
    transform: {
      title: 'Transformations',
      description: 'Rotate, flip, and zoom your image as you like.',
      rotate: {
        title: 'Rotate',
        description: 'Rotate the image by 90° or 180° in any direction',
      },
      flip: {
        title: 'Flip',
        description: 'Flip the image horizontally or vertically',
      },
      zoom: {
        title: 'Zoom',
        description: 'Enlarge or reduce the view of the image',
      },
      border: {
        title: 'Border & Corners',
        description: 'Add a border or round the corners',
      },
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
        shadow: 'Add shadow',
      },
      tip: 'Tip: Click on text in the image to select and edit it. Drag the text to the desired position.',
    },
    resize: {
      title: 'Resize',
      description: 'Change the dimensions of your image.',
      features: {
        custom: 'Enter width and height manually',
        aspectRatio: 'Maintain aspect ratio for proportional resizing',
        presets: 'Choose from predefined sizes for social media and web',
      },
    },
    export: {
      title: 'Export & Download',
      description: 'Save your edited image in various formats.',
      steps: {
        step1: 'Click the "Download" button',
        step2: 'Choose the desired file format',
        step3: 'The image will be downloaded automatically',
      },
      formatsTitle: 'Available Export Formats',
    },
    gallery: {
      title: 'Gallery',
      description: 'In the gallery you can store and manage multiple images.',
      features: {
        upload: 'Upload multiple images at once',
        preview: 'View images in a preview',
        openEditor: 'Open an image directly in the editor for editing',
        download: 'Download images individually',
        delete: 'Delete images you no longer need',
      },
    },
    collage: {
      title: 'Collage & Layers',
      description:
        'In collage mode you can place multiple images on top of each other to create a creative composition.',
      features: {
        addLayer: 'Add more images as layers',
        drag: 'Freely position layers on the canvas',
        resize: 'Resize each layer independently',
        order: 'Change the order of layers',
        background: 'Choose the canvas background color',
        merge: 'Merge all layers into the final image',
      },
      tip: 'Tip: Activate collage mode via the button in the editor toolbar.',
    },
    mobile: {
      title: 'Mobile Controls',
      description:
        'The editor is fully optimized for touch devices – all features are available on smartphones and tablets.',
      gestures: {
        title: 'Touch Gestures',
        pinch: 'Spread or pinch two fingers to zoom',
        drag: 'Drag with one finger to pan the image',
        doubleTap: 'Double-tap on text to edit it',
        longPress: 'Long press opens editing options',
        tap: 'Tap on text to select it',
      },
    },
    batch: {
      title: 'Batch Processing',
      description:
        'With batch processing you can convert and download multiple images at once – without editing each image individually.',
      features: {
        multiUpload: 'Upload multiple images at once',
        formatConvert: 'Convert all images to one format',
        qualitySet: 'Set quality and size for all images',
        zipDownload: 'Download results as a ZIP file',
      },
      link: 'Go to Batch Processing',
    },
    privacy: {
      title: 'Privacy & Local Processing',
      description:
        'All image processing happens directly in your browser – no images are uploaded to servers. Your data stays on your device at all times.',
      features: {
        local: 'Fully local processing in the browser',
        noUpload: 'No uploads to external servers',
        noAccount: 'No account or login required',
        offline: 'Works offline after the first load',
      },
    },
    history: {
      title: 'History (Undo/Redo)',
      description: 'All your editing steps are saved. You can undo or redo changes at any time.',
      undo: 'Undo',
      redo: 'Redo',
      shortcuts: {
        addText: 'Add text',
        escape: 'Deselect / Cancel',
        delete: 'Delete selected element',
        pasteImage: 'Paste image from clipboard',
      },
    },
    settings: {
      title: 'Settings',
      description: 'Customize the application to your needs.',
      features: {
        language: 'Switch language (German/English)',
        theme: 'Switch between light and dark design',
      },
    },
    cta: {
      title: 'Ready to Get Started?',
      description: 'Open the editor now and start editing your images!',
      button: 'Go to Editor',
    },
    badge: 'User guide',
  },
  filters: {
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    grayscale: 'Grayscale',
    sepia: 'Sepia',
    blur: 'Blur',
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
      delete: 'Delete',
    },
    dialogs: {
      saveName: 'Preset name:',
      defaultName: 'My Preset',
      saveDescription: 'Description (optional):',
      confirmDelete: 'Do you really want to delete this preset?',
      deleteTitle: 'Delete preset?',
    },
    errors: {
      invalidFormat: 'Invalid file format',
    },
    noir: 'Noir',
    dreamy: 'Dreamy',
  },
  shortcuts: {
    title: 'Keyboard Shortcuts',
    close: 'Close',
    groups: {
      general: 'General',
      navigation: 'Navigation',
      editor: 'Editor',
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
      reset: 'Reset',
    },
  },
  common: {
    cancel: 'Cancel',
    reset: 'Reset',
    increase: 'Increase',
    decrease: 'Decrease',
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
      undoSuccess: 'Original image restored',
      cancelled: 'Cropping cancelled',
    },
    editor: {
      printFailed: 'Printing failed',
      imageDeleted: 'Image successfully deleted',
      galleryLoaded: 'Image loaded from gallery',
      galleryError: 'Error loading from gallery',
      resizeSuccess: 'Image size successfully changed: {width}×{height}px',
      resizeInvalid: 'Invalid image size – please enter values between 1 and {max} px',
      imageReset: 'Image reset to original state',
      exporting: 'Exporting...',
      imageDetached: 'Image detached from background – now freely movable',
      imageReattached: 'Image reattached to the background',
      detachFailed: 'Detaching failed',
      reattachFailed: 'Reattaching failed',
    },
    presets: {
      applied: 'Preset "{name}" applied',
      saved: 'Preset "{name}" saved',
      deleted: 'Preset "{name}" deleted',
      exported: '{count} preset(s) exported',
      imported: '{count} preset(s) imported',
      noCustomPresets: 'No custom presets available',
      importError: 'Error importing presets',
    },
    transform: {
      rotated90: 'Image rotated 90°',
      rotated180: 'Image rotated 180°',
      flippedHorizontal: 'Image flipped horizontally',
      flippedVertical: 'Image flipped vertically',
      panReset: 'Pan position reset',
      rotationReset: 'Rotation reset',
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
      fileRemoved: '"{name}" removed',
      zipCreating: 'Creating ZIP file...',
      zipDownloaded: 'ZIP file downloaded',
      conversionReset: 'Conversion reset – images preserved',
    },
    conversion: {
      success: '{from} successfully converted to {to}',
      error: 'Conversion failed: {error}',
      downloadStarted: 'Downloading {filename}',
      uploadReceived: 'Image received – converting...',
    },
    network: {
      online: 'Connection restored',
      offline: 'No connection – working offline',
    },
    text: {
      saveError: 'Error saving text',
      deleteError: 'Error deleting text',
    },
    gallery: {
      pasted: 'Image added from clipboard',
    },
  },
  confirm: {
    cancel: 'Cancel',
    delete: 'Delete',
    reset: 'Reset',
    editor: {
      resetTitle: 'Discard all changes?',
      resetMessage:
        'The image will be reset to its original state. All filters, texts, crops and transformations will be lost.',
      clearTitle: 'Remove image?',
      clearMessage: 'Do you really want to remove the image? All changes will be lost.',
      clearCollageMessage:
        'Do you really want to remove the collage? All layers and changes will be lost.',
    },
  },
  layerPanel: {
    tabs: {
      layers: 'Layers',
      text: 'Text',
    },
    history: {
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      preview: 'Preview',
    },
    layers: {
      title: 'Layers',
      hide: 'Hide',
      show: 'Show',
      delete: 'Delete',
      moveUp: 'Move up',
      moveDown: 'Move down',
      duplicate: 'Duplicate',
      confirmDelete: 'Do you really want to delete this layer?',
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
      blue: 'Blue',
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
      opacity: 'Opacity',
    },
    filters: {
      title: 'Filters',
      brightness: 'Brightness',
      contrast: 'Contrast',
      saturation: 'Saturation',
      grayscale: 'Grayscale',
      reset: 'Reset filters',
    },
    border: {
      title: 'Border',
      width: 'Border width',
      color: 'Border color',
      radius: 'Corner radius',
    },
    shadow: {
      title: 'Drop Shadow',
      enable: 'Enable shadow',
      offsetX: 'Offset X',
      offsetY: 'Offset Y',
      blur: 'Blur',
      color: 'Shadow color',
      opacity: 'Opacity',
    },
    hints: {
      selectLayer: 'Click on an image in the canvas to edit it',
      addText: 'Click on "Add text" to create a new text',
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
      newText: 'New Text',
    },
  },
  batch: {
    title: 'Batch Conversion',
    subtitle: 'Convert multiple images at once to your desired format',
    upload: {
      title: 'Upload Images',
      description: 'Drag your images here or click to select',
      hint: 'JPG, PNG, WebP, GIF, BMP, TIFF, HEIC, RAW (CR2, NEF, ARW, DNG …) and more',
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
      prefixPlaceholder: 'e.g. converted_',
      pdfMode: 'PDF Mode',
      pdfModeSingle: 'Each image as individual PDF',
      pdfModeMerged: 'All images into one PDF',
    },
    processing: 'Converting...',
    start: 'Start Conversion',
    reconvert: 'Re-convert',
    downloadAll: 'Download All',
    downloadZip: 'Download as ZIP',
    clearAll: 'Remove All',
    resetConversion: 'Reset Conversion',
    mergedPdfFilename: 'Merged',
    files: {
      title: 'Files',
      download: 'Download',
      preview: 'Preview',
    },
    preview: {
      original: 'Original',
      processed: 'Converted',
    },
    confirmClear: 'Do you really want to remove all files?',
    clearAllTitle: 'Remove all files?',
  },
  notFound: {
    title: 'Page not found',
    description: 'The requested page does not exist. It may have been moved or deleted.',
    backHome: 'Back to Home',
  },
  handoff: {
    title: '{count} image(s) ready for import',
    from: 'Transferred from {tool}',
    accept: 'Import images',
    dismiss: 'Dismiss',
    forwardTitle: 'Download started!',
    forwardText: 'Want to keep working with your image in another Kodini tool?',
    forwardColorExtractor: 'Extract colors',
    forwardColorExtractorHint: 'Get a color palette from the image',
    forwardVisualizer: 'Use in Visualizer',
    forwardVisualizerHint: 'Use it as a background in the audio visualizer',
    forwardDismiss: 'No thanks',
  },
};
