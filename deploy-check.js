#!/usr/bin/env node

/**
 * Pre-Deployment Check
 * Prüft ob alles bereit für Deployment ist
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${CYAN}========================================${RESET}`);
console.log(`${CYAN}  Pre-Deployment Check${RESET}`);
console.log(`${CYAN}========================================${RESET}`);
console.log('');

let hasErrors = false;
let hasWarnings = false;

// Check 1: dist Verzeichnis existiert
console.log(`${YELLOW}[1/7] Prüfe Build-Verzeichnis...${RESET}`);
if (fs.existsSync('./dist')) {
  const distFiles = fs.readdirSync('./dist');
  console.log(`${GREEN}✓ dist/ existiert (${distFiles.length} Dateien)${RESET}`);
  
  // Check index.html
  if (fs.existsSync('./dist/index.html')) {
    console.log(`${GREEN}✓ index.html gefunden${RESET}`);
  } else {
    console.log(`${RED}✗ index.html fehlt!${RESET}`);
    hasErrors = true;
  }
  
  // Check assets
  if (fs.existsSync('./dist/assets')) {
    const assetsCount = fs.readdirSync('./dist/assets').length;
    console.log(`${GREEN}✓ assets/ gefunden (${assetsCount} Dateien)${RESET}`);
  } else {
    console.log(`${RED}✗ assets/ fehlt!${RESET}`);
    hasErrors = true;
  }
} else {
  console.log(`${RED}✗ dist/ existiert nicht! Führe 'npm run build' aus.${RESET}`);
  hasErrors = true;
}
console.log('');

// Check 2: vite.config.ts base path
console.log(`${YELLOW}[2/7] Prüfe Vite-Konfiguration...${RESET}`);
if (fs.existsSync('./vite.config.ts')) {
  const viteConfig = fs.readFileSync('./vite.config.ts', 'utf-8');
  
  if (viteConfig.includes("base: '/bilderseriebearbeiten/'")) {
    console.log(`${GREEN}✓ Korrekter base-path gesetzt${RESET}`);
  } else {
    console.log(`${RED}✗ Base-path fehlt oder ist falsch!${RESET}`);
    console.log(`${YELLOW}  Sollte sein: base: '/bilderseriebearbeiten/'${RESET}`);
    hasErrors = true;
  }
} else {
  console.log(`${RED}✗ vite.config.ts nicht gefunden!${RESET}`);
  hasErrors = true;
}
console.log('');

// Check 3: package.json
console.log(`${YELLOW}[3/7] Prüfe package.json...${RESET}`);
if (fs.existsSync('./package.json')) {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log(`${GREEN}✓ Build-Script gefunden${RESET}`);
  } else {
    console.log(`${RED}✗ Build-Script fehlt!${RESET}`);
    hasErrors = true;
  }
  
  // Check wichtige Dependencies
  const requiredDeps = ['vue', 'vite', '@vitejs/plugin-vue'];
  let missingDeps = [];
  
  requiredDeps.forEach(dep => {
    if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    console.log(`${GREEN}✓ Alle wichtigen Dependencies vorhanden${RESET}`);
  } else {
    console.log(`${YELLOW}⚠ Fehlende Dependencies: ${missingDeps.join(', ')}${RESET}`);
    hasWarnings = true;
  }
} else {
  console.log(`${RED}✗ package.json nicht gefunden!${RESET}`);
  hasErrors = true;
}
console.log('');

// Check 4: node_modules
console.log(`${YELLOW}[4/7] Prüfe Dependencies...${RESET}`);
if (fs.existsSync('./node_modules')) {
  console.log(`${GREEN}✓ node_modules vorhanden${RESET}`);
} else {
  console.log(`${YELLOW}⚠ node_modules fehlt - führe 'npm install' aus${RESET}`);
  hasWarnings = true;
}
console.log('');

// Check 5: TypeScript
console.log(`${YELLOW}[5/7] Prüfe TypeScript-Konfiguration...${RESET}`);
if (fs.existsSync('./tsconfig.json')) {
  console.log(`${GREEN}✓ tsconfig.json gefunden${RESET}`);
} else {
  console.log(`${YELLOW}⚠ tsconfig.json nicht gefunden${RESET}`);
  hasWarnings = true;
}
console.log('');

// Check 6: Git Status (optional)
console.log(`${YELLOW}[6/7] Prüfe Git-Status...${RESET}`);
if (fs.existsSync('./.git')) {
  try {
    const { execSync } = require('child_process');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (gitStatus.trim()) {
      console.log(`${YELLOW}⚠ Uncommitted changes vorhanden${RESET}`);
      hasWarnings = true;
    } else {
      console.log(`${GREEN}✓ Alle Änderungen committed${RESET}`);
    }
  } catch (e) {
    console.log(`${YELLOW}⚠ Git-Status konnte nicht geprüft werden${RESET}`);
  }
} else {
  console.log(`${YELLOW}⚠ Kein Git-Repository${RESET}`);
}
console.log('');

// Check 7: Build-Größe
console.log(`${YELLOW}[7/7] Prüfe Build-Größe...${RESET}`);
if (fs.existsSync('./dist')) {
  function getDirectorySize(dirPath) {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
    
    return size;
  }
  
  const sizeBytes = getDirectorySize('./dist');
  const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
  
  console.log(`${GREEN}✓ Build-Größe: ${sizeMB} MB${RESET}`);
  
  if (sizeMB > 10) {
    console.log(`${YELLOW}⚠ Build ist größer als 10 MB - Optimierung empfohlen${RESET}`);
    hasWarnings = true;
  }
}
console.log('');

// Zusammenfassung
console.log(`${CYAN}========================================${RESET}`);
console.log(`${CYAN}  Zusammenfassung${RESET}`);
console.log(`${CYAN}========================================${RESET}`);

if (hasErrors) {
  console.log(`${RED}✗ Deployment NICHT bereit - Fehler müssen behoben werden!${RESET}`);
  console.log('');
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${YELLOW}⚠ Deployment bereit mit Warnungen${RESET}`);
  console.log(`${YELLOW}  Prüfe die Warnungen oben${RESET}`);
  console.log('');
  console.log(`${GREEN}Fortfahren mit Deployment? (Strg+C zum Abbrechen)${RESET}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✓ Alles bereit für Deployment!${RESET}`);
  console.log('');
  console.log(`${CYAN}Nächste Schritte:${RESET}`);
  console.log('  1. npm run deploy:windows  (Windows PowerShell)');
  console.log('  2. npm run deploy:linux    (Linux/Mac Bash)');
  console.log('');
  process.exit(0);
}
