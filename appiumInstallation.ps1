#
# sefercinew mobil test ortamı kurulumu — Windows
# (macOS / Linux için: appiumInstallation.sh)
#
# Kullanım (PowerShell'de, proje klasöründe):
#   powershell -ExecutionPolicy Bypass -File .\appiumInstallation.ps1           -> kurulum + kontroller
#   powershell -ExecutionPolicy Bypass -File .\appiumInstallation.ps1 -Start    -> kurulumdan sonra Appium'u başlatır
#
# Script idempotenttir: kurulu olanı atlar, yalnızca eksik olanı kurar.
# iOS testleri Windows'ta çalışmaz (Xcode gerekir), bu yüzden XCUITest kurulmaz.

param(
    [switch]$Start
)

$NodeVersion = '20.19.6'
# BrowserStack tarafındaki appiumVersion ile aynı ana sürüm olmalı (utils/driver.ts).
$AppiumMajor = '2'

$script:Warnings = 0

function Fail([string]$Message) {
    Write-Host "[HATA] $Message" -ForegroundColor Red
    exit 1
}

function Warn([string]$Message) {
    Write-Host "[UYARI] $Message" -ForegroundColor Yellow
    $script:Warnings++
}

function Ok([string]$Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Info([string]$Message) {
    Write-Host $Message -ForegroundColor Cyan
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# PATH değişikliklerini (ör. nvm use sonrası) bu oturuma yansıt
function Update-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

# Script hangi klasörden çağrılırsa çağrılsın proje klasöründe çalış.
Set-Location -Path $PSScriptRoot

if ($env:OS -ne 'Windows_NT') {
    Fail "Bu script Windows içindir. macOS / Linux'ta şunu çalıştırın: ./appiumInstallation.sh"
}

Info 'Starting Windows Mobile Environment Setup...'

# ---------------------------------------------------------------- Node.js
# Windows'ta nvm-sh çalışmaz; sürüm yönetimi için nvm-windows kullanılır.
Info "Setting up Node.js $NodeVersion..."
if (Test-Command 'nvm') {
    Ok 'nvm-windows is already installed.'
    & nvm install $NodeVersion
    if ($LASTEXITCODE -ne 0) { Fail "Node.js $NodeVersion kurulamadı." }
    # nvm use, Program Files altında sembolik link oluşturduğu için yönetici yetkisi isteyebilir.
    & nvm use $NodeVersion
    if ($LASTEXITCODE -ne 0) {
        Fail "Node.js $NodeVersion etkinleştirilemedi. PowerShell'i 'Yönetici olarak çalıştır' ile açıp tekrar deneyin."
    }
    Update-SessionPath
}
elseif (Test-Command 'node') {
    $current = (& node -v).Trim()
    if ($current.TrimStart('v').Split('.')[0] -ne $NodeVersion.Split('.')[0]) {
        # Farklı ana sürüm (ör. Node 25) playwright-bdd'nin modül yüklemesini bozabiliyor.
        Fail "Kurulu Node $current, bu proje Node $($NodeVersion.Split('.')[0]).x ister. Sürümü yönetmek için:
    winget install CoreyButler.NVMforWindows
    Kurulumdan sonra yeni bir terminal açıp bu script'i tekrar çalıştırın."
    }
    elseif ($current -ne "v$NodeVersion") {
        Warn "nvm-windows yok; kurulu Node $current (önerilen v$NodeVersion). Aynı ana sürüm olduğu için devam ediliyor."
    }
}
else {
    Fail "Node.js bulunamadı. nvm-windows'u kurun, yeni bir terminal açın ve script'i tekrar çalıştırın:
    winget install CoreyButler.NVMforWindows"
}

if (-not (Test-Command 'node')) { Fail 'Node.js PATH içinde bulunamadı. Yeni bir terminal açıp tekrar deneyin.' }
$activeNode = (& node -v).Trim()
if ($activeNode.TrimStart('v').Split('.')[0] -ne $NodeVersion.Split('.')[0]) {
    Fail "Aktif Node $activeNode, beklenen v$NodeVersion. Yeni bir terminal açıp 'nvm use $NodeVersion' çalıştırın."
}
Ok "Node $activeNode aktif."

# ---------------------------------------------------------------- Appium
Info 'Checking Appium...'
$currentAppium = ''
if (Test-Command 'appium') {
    $currentAppium = "$(& appium -v 2>$null)".Trim()
}

if (-not $currentAppium) {
    Info "Installing Appium $AppiumMajor.x via NPM..."
    & npm install -g "appium@$AppiumMajor"
    if ($LASTEXITCODE -ne 0) { Fail 'Appium kurulamadı.' }
    Update-SessionPath
}
elseif ($currentAppium.Split('.')[0] -ne $AppiumMajor) {
    Warn "Kurulu Appium $currentAppium, beklenen $AppiumMajor.x. Yeniden kuruluyor..."
    & npm install -g "appium@$AppiumMajor"
    if ($LASTEXITCODE -ne 0) { Fail "Appium $AppiumMajor.x kurulamadı." }
}
else {
    Ok "Appium $currentAppium is already installed."
}

if (-not (Test-Command 'appium')) {
    Fail 'Appium kuruldu ama PATH içinde bulunamadı. Yeni bir terminal açıp script''i tekrar çalıştırın.'
}

# ---------------------------------------------------------------- Driver
# 'appium driver list' çıktısını stderr'e yazar. PowerShell 5.1'de native stderr
# yönlendirmesi sorun çıkarabildiği için komut cmd üzerinden çalıştırılır.
Info 'Checking Android driver (UiAutomator2)...'
$driverList = & cmd /c 'appium driver list --installed 2>&1'
if ($driverList -match 'uiautomator2') {
    Ok 'uiautomator2 driver is ready.'
}
else {
    Info 'Installing uiautomator2 driver...'
    & appium driver install uiautomator2
    if ($LASTEXITCODE -ne 0) { Fail 'uiautomator2 driver kurulamadı.' }
}

# ---------------------------------------------------------------- Java (yalnızca kontrol)
# Java kurulumu bu script'in kapsamında değil; UiAutomator2 için gerekli olduğundan
# yalnızca varlığı kontrol edilir.
Info 'Checking Java...'
if (-not $env:JAVA_HOME) {
    Warn 'JAVA_HOME tanımlı değil. UiAutomator2 session açarken hata verebilir.'
}
elseif (-not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    Warn "JAVA_HOME ($env:JAVA_HOME) geçerli bir Java kurulumunu göstermiyor."
}
else {
    Ok "Java bulundu: $env:JAVA_HOME"
}

# ---------------------------------------------------------------- Android SDK
Info 'Checking Android SDK...'
$defaultSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (-not $env:ANDROID_HOME -and (Test-Path $defaultSdk)) {
    $env:ANDROID_HOME = $defaultSdk
    Warn "ANDROID_HOME tanımlı değildi, bu oturum için $defaultSdk kullanıldı. Kalıcı olması için:
    [Environment]::SetEnvironmentVariable('ANDROID_HOME', '$defaultSdk', 'User')
    ve PATH'e şunları ekleyin: %ANDROID_HOME%\platform-tools ; %ANDROID_HOME%\emulator"
}

if (-not $env:ANDROID_HOME) {
    Warn "ANDROID_HOME tanımlı değil ve Android SDK bulunamadı ($defaultSdk). Android Studio'yu kurun."
}
else {
    $env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
    Ok "Android SDK: $env:ANDROID_HOME"
}

if (Test-Command 'adb') {
    $adbVersion = (& adb version | Select-Object -First 1)
    Ok "adb bulundu: $adbVersion"
    $devices = @(& adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "`tdevice$" })
    if ($devices.Count -eq 0) {
        Warn 'Bağlı cihaz/emülatör yok. Testlerden önce bir emülatör açın (adb devices).'
    }
    else {
        Ok "$($devices.Count) cihaz/emülatör bağlı."
    }
}
else {
    Warn 'adb bulunamadı. Android SDK platform-tools kurulu ve PATH içinde olmalı.'
}

# ---------------------------------------------------------------- Proje bağımlılıkları
Info 'Installing project dependencies (npm install)...'
& npm install
if ($LASTEXITCODE -ne 0) { Fail 'npm install başarısız oldu.' }
Ok 'Proje bağımlılıkları kuruldu.'

# playwright-bdd, Playwright'ın iç modüllerini kullanır; package.json'da sabitlenen
# sürümden farklı bir Playwright kurulursa bddgen çöker. Kurulu sürümü doğrula.
Info 'Checking Playwright / playwright-bdd versions...'
$expectedPw = "$(& node -p "require('./package.json').devDependencies['@playwright/test']" 2>$null)".Trim()
$installedPw = "$(& node -p "require('@playwright/test/package.json').version" 2>$null)".Trim()
$installedBdd = "$(& node -p "require('playwright-bdd/package.json').version" 2>$null)".Trim()

if (-not $installedPw) { Fail "@playwright/test kurulmamış. 'npm install' çıktısını kontrol edin." }
if (-not $installedBdd) { Fail "playwright-bdd kurulmamış. 'npm install' çıktısını kontrol edin." }
if (($expectedPw -match '^[0-9]') -and ($installedPw -ne $expectedPw)) {
    Fail "Kurulu Playwright $installedPw, package.json'da sabitlenen $expectedPw. Düzeltmek için:
    npm install -D @playwright/test@$expectedPw --save-exact"
}
Ok "@playwright/test $installedPw, playwright-bdd $installedBdd"

# ---------------------------------------------------------------- .env
Info 'Checking .env...'
if (-not (Test-Path '.env')) {
    if (Test-Path '.env.example') {
        Copy-Item '.env.example' '.env'
        Warn '.env yoktu, .env.example dosyasından oluşturuldu (RUN_ENV=local). BrowserStack için değerleri doldurun.'
    }
    else {
        Warn '.env ve .env.example bulunamadı. Varsayılan RUN_ENV=local kullanılacak.'
    }
}
else {
    Ok '.env mevcut.'
}

# ---------------------------------------------------------------- APK
Info 'Checking APK (APP_PATH)...'
$appPathVal = ''
if (Test-Path '.env') {
    $line = Get-Content '.env' | Where-Object { $_ -match '^\s*APP_PATH=' } | Select-Object -Last 1
    if ($line) { $appPathVal = ($line -replace '^\s*APP_PATH=', '').Trim().Trim('"', "'") }
}
if (-not $appPathVal) {
    Warn "APP_PATH boş: testler cihazda önceden kurulu Seferci uygulamasını kullanacak. APK'yı apps\ klasörüne koyup .env'e APP_PATH=./apps/<dosya>.apk yazabilirsiniz."
}
elseif (Test-Path -PathType Leaf $appPathVal) {
    $sizeMb = [math]::Round((Get-Item $appPathVal).Length / 1MB, 1)
    Ok "APK bulundu: $appPathVal ($sizeMb MB)"
}
else {
    Warn "APP_PATH dosyası bulunamadı: $appPathVal - APK'yı ortak alandan indirip bu yola koyun (bkz. apps\README.md)."
}

# ---------------------------------------------------------------- bddgen (cihaz gerektirmez)
# .feature dosyalarını testlere çevirir: step eşleşmelerini ve Playwright/playwright-bdd
# uyumunu Appium'a bağlanmadan doğrular.
Info 'Generating tests from feature files (bddgen)...'
& npx bddgen
if ($LASTEXITCODE -ne 0) {
    Fail 'bddgen başarısız oldu. Yukarıdaki hatayı kontrol edin (eksik step tanımı veya sürüm uyumsuzluğu).'
}
Ok 'Senaryolar başarıyla üretildi (.features-gen/).'

# ---------------------------------------------------------------- Özet
Write-Host '--------------------------------------'
Write-Host 'OS:             windows'
Write-Host "Node Version:   $((& node -v).Trim())"
Write-Host "Appium Version: $("$(& appium -v 2>$null)".Trim())"
Write-Host "Playwright:     $installedPw (playwright-bdd $installedBdd)"
if ($script:Warnings -gt 0) {
    Write-Host "Kurulum $($script:Warnings) uyarı ile tamamlandı. Yukarıdaki uyarıları kontrol edin." -ForegroundColor Yellow
}
else {
    Write-Host 'Setup complete!' -ForegroundColor Green
}
Write-Host '--------------------------------------'

if ($Start) {
    Write-Host 'Starting Appium Server...'
    & appium --address 127.0.0.1 --port 4723
}
else {
    Write-Host "Appium'u başlatmak için: appium --address 127.0.0.1 --port 4723"
    Write-Host 'Testleri çalıştırmak için (ayrı terminalde): npm test'
    Write-Host 'Raporu açmak için: npm run report'
}
