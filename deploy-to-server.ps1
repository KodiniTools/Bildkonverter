param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerUser,
    
    [string]$ServerPath = "/var/www/bilderseriebearbeiten",
    
    [string]$LocalDistPath = "dist"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================"
Write-Host "   DEPLOYMENT ZU SERVER"
Write-Host "========================================`n"

Write-Host "Konfiguration:"
Write-Host "- Server: $ServerUser@$ServerIP"
Write-Host "- Ziel-Pfad: $ServerPath"
Write-Host "- Lokaler Build: $LocalDistPath`n"

if (-not (Test-Path $LocalDistPath)) {
    Write-Host "FEHLER: $LocalDistPath Ordner nicht gefunden!"
    Write-Host "Bitte fuehren Sie zuerst 'npm run build' aus.`n"
    exit 1
}

Write-Host "Teste SSH-Verbindung..."
$testCmd = "echo OK"
$sshTarget = "$ServerUser@$ServerIP"

try {
    $result = ssh -o ConnectTimeout=5 $sshTarget $testCmd 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Verbindung fehlgeschlagen"
    }
    Write-Host "SSH-Verbindung erfolgreich!`n"
} catch {
    Write-Host "FEHLER: Kann keine SSH-Verbindung herstellen!"
    Write-Host "Ueberpruefen Sie ServerIP, ServerUser und SSH-Schluessel.`n"
    exit 1
}

Write-Host "Erstelle Backup..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "/var/backups/bilderseriebearbeiten"
$backupName = "backup_$timestamp"

ssh $sshTarget "mkdir -p $backupDir"

$checkCmd = "test -d $ServerPath && echo EXISTS || echo NOTFOUND"
$exists = ssh $sshTarget $checkCmd

if ($exists -eq "EXISTS") {
    ssh $sshTarget "cp -r $ServerPath $backupDir/$backupName"
    Write-Host "Backup erstellt: $backupDir/$backupName`n"
} else {
    Write-Host "Kein vorheriges Deployment zum Backup`n"
}

Write-Host "Bereite Zielverzeichnis vor..."
ssh $sshTarget "mkdir -p $ServerPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host "FEHLER: Konnte Zielverzeichnis nicht erstellen!`n"
    exit 1
}

Write-Host "Loesche alte Dateien..."
ssh $sshTarget "rm -rf $ServerPath/*"

Write-Host "Uebertrage Dateien..."
Write-Host "(Dies kann einige Minuten dauern...)`n"

$hasRsync = Get-Command rsync -ErrorAction SilentlyContinue

if ($hasRsync) {
    Write-Host "Verwende rsync..."
    $source = "$LocalDistPath/"
    $destination = "${sshTarget}:${ServerPath}/"
    rsync -avz --delete $source $destination
    $success = ($LASTEXITCODE -eq 0)
} else {
    Write-Host "Verwende scp..."
    $source = "$LocalDistPath\*"
    $destination = "${sshTarget}:${ServerPath}/"
    scp -r $source $destination
    $success = ($LASTEXITCODE -eq 0)
}

if (-not $success) {
    Write-Host "`nFEHLER: Dateiuebertragung fehlgeschlagen!`n"
    exit 1
}

Write-Host "`nDateien erfolgreich uebertragen!`n"

Write-Host "Setze Berechtigungen..."
ssh $sshTarget "chown -R www-data:www-data $ServerPath"
ssh $sshTarget "chmod -R 755 $ServerPath"
Write-Host "Berechtigungen gesetzt!`n"

Write-Host "Versuche Nginx neu zu laden..."
ssh $sshTarget "command -v nginx > /dev/null && systemctl reload nginx || echo 'Nginx nicht gefunden'"
Write-Host ""

Write-Host "========================================"
Write-Host "   DEPLOYMENT ERFOLGREICH!"
Write-Host "========================================`n"
Write-Host "Anwendung erreichbar unter: http://$ServerIP`n"
