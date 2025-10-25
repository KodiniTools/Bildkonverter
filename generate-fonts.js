/**
 * generate-fonts.js (ES Module Version)
 * 
 * Script zum automatischen Generieren von:
 * 1. fonts.css mit @font-face Deklarationen
 * 2. fontList.js mit Array aller Schriftarten
 * 
 * Verwendung:
 * 1. Kopiere alle .woff2 Dateien nach src/assets/fonts/
 * 2. Führe aus: node generate-fonts.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pfade
const fontsDir = path.join(__dirname, 'src', 'assets', 'fonts')
const outputCssFile = path.join(__dirname, 'src', 'assets', 'fonts', 'fonts.css')
const outputJsFile = path.join(__dirname, 'src', 'assets', 'fonts', 'fontList.js')

/**
 * Extrahiert den Font-Namen aus dem Dateinamen
 * z.B. "Roboto-Regular.woff2" -> "Roboto Regular"
 * oder "OpenSans-Bold.woff2" -> "OpenSans Bold"
 */
function getFontName(filename) {
  // Entferne .woff2 Extension
  let name = filename.replace('.woff2', '')
  
  // Konvertiere Dashes/Underscores zu Spaces (OHNE Varianten zu entfernen)
  name = name.replace(/[-_]/g, ' ')
  
  return name.trim()
}

/**
 * Generiert @font-face CSS für eine Font-Datei
 */
function generateFontFace(filename) {
  const fontName = getFontName(filename)
  const fontPath = `./${filename}`
  
  return `@font-face {
  font-family: '${fontName}';
  src: url('${fontPath}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
`
}

/**
 * Hauptfunktion
 */
function generateFontFiles() {
  try {
    console.log('🔍 Suche nach woff2-Dateien in:', fontsDir)
    
    // Prüfe ob Fonts-Verzeichnis existiert
    if (!fs.existsSync(fontsDir)) {
      console.error('❌ Fonts-Verzeichnis nicht gefunden:', fontsDir)
      console.log('💡 Erstelle das Verzeichnis mit: mkdir src\\assets\\fonts')
      return
    }
    
    // Lese alle .woff2 Dateien
    const files = fs.readdirSync(fontsDir)
    const woff2Files = files.filter(file => file.endsWith('.woff2'))
    
    if (woff2Files.length === 0) {
      console.error('❌ Keine .woff2 Dateien gefunden in:', fontsDir)
      return
    }
    
    console.log(`✅ ${woff2Files.length} Font-Dateien gefunden`)
    
    // Generiere CSS
    let css = `/**
 * fonts.css - Auto-generierte Font-Deklarationen
 * Generiert am: ${new Date().toLocaleString('de-DE')}
 * Anzahl Fonts: ${woff2Files.length}
 */

`
    
    woff2Files.forEach(file => {
      css += generateFontFace(file)
    })
    
    // Schreibe CSS-Datei
    fs.writeFileSync(outputCssFile, css)
    console.log('✅ fonts.css erstellt:', outputCssFile)
    
    // Generiere JavaScript Array (unique font names)
    const fontNames = [...new Set(woff2Files.map(getFontName))].sort()
    
    const jsContent = `/**
 * fontList.js - Auto-generierte Liste aller verfügbaren Schriftarten
 * Generiert am: ${new Date().toLocaleString('de-DE')}
 * Anzahl Fonts: ${fontNames.length}
 */

export const availableFonts = ${JSON.stringify(fontNames, null, 2)}

export default availableFonts
`
    
    // Schreibe JS-Datei
    fs.writeFileSync(outputJsFile, jsContent)
    console.log('✅ fontList.js erstellt:', outputJsFile)
    
    console.log('\n📊 Zusammenfassung:')
    console.log(`   - ${woff2Files.length} Font-Dateien verarbeitet`)
    console.log(`   - ${fontNames.length} eindeutige Schriftarten gefunden`)
    console.log('\n🎉 Fertig! Die Fonts können jetzt verwendet werden.')
    console.log('\n📝 Nächste Schritte:')
    console.log('   1. Importiere in main.js: import "@/assets/fonts/fonts.css"')
    console.log('   2. Verwende fontList.js in deiner Komponente')
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
  }
}

// Führe das Script aus
generateFontFiles()
