#!/bin/bash
#
# sefercinew mobil test ortamı kurulumu — macOS ve Linux
# (Windows için: appiumInstallation.ps1)
#
# Kullanım:
#   ./appiumInstallation.sh            -> kurulum + kontroller
#   ./appiumInstallation.sh --ios      -> iOS (XCUITest) driver'ını da kurar (yalnızca macOS)
#   ./appiumInstallation.sh --start    -> kurulumdan sonra Appium sunucusunu başlatır
#
# Script idempotenttir: kurulu olanı atlar, yalnızca eksik olanı kurar.

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

NODE_VERSION="20.19.6"
# BrowserStack tarafındaki appiumVersion ile aynı ana sürüm olmalı (utils/driver.ts).
APPIUM_MAJOR="2"
NVM_INSTALL_URL="https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh"

INSTALL_IOS=false
START_APPIUM=false
for arg in "$@"; do
    case "$arg" in
        --ios)   INSTALL_IOS=true ;;
        --start) START_APPIUM=true ;;
        *) echo -e "${RED}❌ Bilinmeyen parametre: $arg${NC}"; exit 1 ;;
    esac
done

WARNINGS=0

fail() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${BLUE}$1${NC}"
}

# Script hangi klasörden çağrılırsa çağrılsın proje klasöründe çalış.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || fail "Proje klasörüne geçilemedi: $PROJECT_DIR"

# ---------------------------------------------------------------- İşletim sistemi
case "$(uname -s)" in
    Darwin)
        OS="mac"
        DEFAULT_ANDROID_SDK="$HOME/Library/Android/sdk"
        ;;
    Linux)
        OS="linux"
        DEFAULT_ANDROID_SDK="$HOME/Android/Sdk"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        fail "Windows algılandı. Bu script macOS/Linux içindir.
   PowerShell'de şunu çalıştırın:
   powershell -ExecutionPolicy Bypass -File .\\\\appiumInstallation.ps1"
        ;;
    *)
        fail "Tanınmayan işletim sistemi: $(uname -s). README.md'deki kurulum adımlarını izleyin."
        ;;
esac

# Kalıcı ortam değişkenleri için kullanıcının shell profil dosyası
case "$(basename "${SHELL:-bash}")" in
    zsh) PROFILE_FILE="$HOME/.zprofile" ;;
    *)   PROFILE_FILE="$HOME/.bashrc" ;;
esac

if [[ "$OS" == "mac" ]]; then
    info "🍎 Starting macOS Mobile Environment Setup..."
else
    info "🐧 Starting Linux Mobile Environment Setup..."
fi

# ---------------------------------------------------------------- Homebrew (yalnızca macOS)
if [[ "$OS" == "mac" ]]; then
    if ! command -v brew &> /dev/null; then
        info "📦 Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
            || fail "Homebrew kurulamadı."
        if [[ $(uname -m) == 'arm64' ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    else
        ok "Homebrew is already installed."
    fi
fi

# ---------------------------------------------------------------- NVM + Node
command -v curl &> /dev/null || fail "curl bulunamadı. Linux'ta: sudo apt install curl (veya dağıtımınızın paket yöneticisi)."

export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    info "🟢 Installing NVM..."
    curl -o- "$NVM_INSTALL_URL" | bash || fail "NVM kurulamadı."
else
    ok "NVM is already installed."
fi

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
command -v nvm &> /dev/null || fail "NVM yüklenemedi ($NVM_DIR/nvm.sh bulunamadı)."

info "⚙️  Setting up Node.js $NODE_VERSION..."
nvm install "$NODE_VERSION" || fail "Node.js $NODE_VERSION kurulamadı."
nvm use "$NODE_VERSION" || fail "Node.js $NODE_VERSION etkinleştirilemedi."
nvm alias default "$NODE_VERSION" > /dev/null
ok "Node $(node -v) aktif."

# ---------------------------------------------------------------- Appium
info "📦 Checking Appium..."
CURRENT_APPIUM=""
if command -v appium &> /dev/null; then
    CURRENT_APPIUM="$(appium -v 2>/dev/null)"
fi

if [[ -z "$CURRENT_APPIUM" ]]; then
    info "Installing Appium ${APPIUM_MAJOR}.x via NPM..."
    npm install -g "appium@${APPIUM_MAJOR}" || fail "Appium kurulamadı."
elif [[ "${CURRENT_APPIUM%%.*}" != "$APPIUM_MAJOR" ]]; then
    warn "Kurulu Appium $CURRENT_APPIUM, beklenen ${APPIUM_MAJOR}.x. Yeniden kuruluyor..."
    npm install -g "appium@${APPIUM_MAJOR}" || fail "Appium ${APPIUM_MAJOR}.x kurulamadı."
else
    ok "Appium $CURRENT_APPIUM is already installed."
fi

# ---------------------------------------------------------------- Driver'lar
# 'appium driver list' çıktısını stderr'e yazar; 2>&1 olmadan grep hiçbir şey göremez.
install_driver() {
    local driver="$1"
    if appium driver list --installed 2>&1 | grep -q "$driver"; then
        ok "$driver driver is ready."
    else
        info "Installing $driver driver..."
        appium driver install "$driver" || fail "$driver driver kurulamadı."
    fi
}

info "🤖 Checking Android driver (UiAutomator2)..."
install_driver "uiautomator2"

if $INSTALL_IOS; then
    if [[ "$OS" == "mac" ]]; then
        info "📱 Checking iOS driver (XCUITest)..."
        install_driver "xcuitest"
    else
        warn "iOS testleri yalnızca macOS'ta (Xcode ile) çalışır; --ios atlandı."
    fi
fi

# ---------------------------------------------------------------- Java (yalnızca kontrol)
# Java kurulumu bu script'in kapsamında değil; UiAutomator2 için gerekli olduğundan
# yalnızca varlığı kontrol edilir.
info "☕ Checking Java..."
if [[ -z "${JAVA_HOME:-}" ]]; then
    warn "JAVA_HOME tanımlı değil. UiAutomator2 session açarken hata verebilir."
elif ! "$JAVA_HOME/bin/java" -version &> /dev/null; then
    warn "JAVA_HOME ($JAVA_HOME) geçerli bir Java kurulumunu göstermiyor."
else
    ok "Java bulundu: $JAVA_HOME"
fi

# ---------------------------------------------------------------- Android SDK
info "🤖 Checking Android SDK..."
if [[ -z "${ANDROID_HOME:-}" && -d "$DEFAULT_ANDROID_SDK" ]]; then
    export ANDROID_HOME="$DEFAULT_ANDROID_SDK"
    warn "ANDROID_HOME tanımlı değildi, bu oturum için $ANDROID_HOME kullanıldı. Kalıcı olması için $PROFILE_FILE dosyasına ekleyin:
    export ANDROID_HOME=\"$DEFAULT_ANDROID_SDK\"
    export PATH=\"\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator:\$PATH\""
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
    warn "ANDROID_HOME tanımlı değil ve Android SDK bulunamadı ($DEFAULT_ANDROID_SDK). Android Studio'yu kurun."
else
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
    ok "Android SDK: $ANDROID_HOME"
fi

if command -v adb &> /dev/null; then
    ok "adb bulundu: $(adb version | head -1)"
    DEVICE_COUNT=$(adb devices | awk 'NR>1 && $2=="device"' | wc -l | tr -d ' ')
    if [[ "$DEVICE_COUNT" -eq 0 ]]; then
        warn "Bağlı cihaz/emülatör yok. Testlerden önce bir emülatör açın (adb devices)."
    else
        ok "$DEVICE_COUNT cihaz/emülatör bağlı."
    fi
else
    warn "adb bulunamadı. Android SDK platform-tools kurulu ve PATH'te olmalı."
fi

# ---------------------------------------------------------------- Proje bağımlılıkları
info "📦 Installing project dependencies (npm install)..."
npm install || fail "npm install başarısız oldu."
ok "Proje bağımlılıkları kuruldu."

# playwright-bdd, Playwright'ın iç modüllerini kullanır; package.json'da sabitlenen
# sürümden farklı bir Playwright kurulursa bddgen çöker. Kurulu sürümü doğrula.
info "🎭 Checking Playwright / playwright-bdd versions..."
EXPECTED_PW=$(node -p "require('./package.json').devDependencies['@playwright/test']" 2>/dev/null)
INSTALLED_PW=$(node -p "require('@playwright/test/package.json').version" 2>/dev/null)
INSTALLED_BDD=$(node -p "require('playwright-bdd/package.json').version" 2>/dev/null)

[[ -z "$INSTALLED_PW" ]] && fail "@playwright/test kurulmamış. 'npm install' çıktısını kontrol edin."
[[ -z "$INSTALLED_BDD" ]] && fail "playwright-bdd kurulmamış. 'npm install' çıktısını kontrol edin."

if [[ "$EXPECTED_PW" =~ ^[0-9] && "$INSTALLED_PW" != "$EXPECTED_PW" ]]; then
    fail "Kurulu Playwright $INSTALLED_PW, package.json'da sabitlenen $EXPECTED_PW. Düzeltmek için:
   npm install -D @playwright/test@$EXPECTED_PW --save-exact"
fi
ok "@playwright/test $INSTALLED_PW, playwright-bdd $INSTALLED_BDD"

# ---------------------------------------------------------------- .env
info "🔑 Checking .env..."
if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
        cp .env.example .env
        warn ".env yoktu, .env.example'dan oluşturuldu (RUN_ENV=local). BrowserStack için değerleri doldurun."
    else
        warn ".env ve .env.example bulunamadı. Varsayılan RUN_ENV=local kullanılacak."
    fi
else
    ok ".env mevcut."
fi

# ---------------------------------------------------------------- APK
info "📦 Checking APK (APP_PATH)..."
APP_PATH_VAL=""
if [[ -f .env ]]; then
    APP_PATH_VAL=$(grep -E '^[[:space:]]*APP_PATH=' .env | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'"'"']//' -e 's/["'"'"']$//')
fi
if [[ -z "$APP_PATH_VAL" ]]; then
    warn "APP_PATH boş: testler cihazda önceden kurulu Seferci uygulamasını kullanacak. APK'yı apps/ klasörüne koyup .env'e APP_PATH=./apps/<dosya>.apk yazabilirsiniz."
elif [[ -f "$APP_PATH_VAL" ]]; then
    ok "APK bulundu: $APP_PATH_VAL ($(du -h "$APP_PATH_VAL" | cut -f1))"
else
    warn "APP_PATH dosyası bulunamadı: $APP_PATH_VAL — APK'yı ortak alandan indirip bu yola koyun (bkz. apps/README.md)."
fi

# ---------------------------------------------------------------- bddgen (cihaz gerektirmez)
# .feature dosyalarını testlere çevirir: step eşleşmelerini ve Playwright/playwright-bdd
# uyumunu Appium'a bağlanmadan doğrular.
info "🧪 Generating tests from feature files (bddgen)..."
if npx bddgen; then
    ok "Senaryolar başarıyla üretildi (.features-gen/)."
else
    fail "bddgen başarısız oldu. Yukarıdaki hatayı kontrol edin (eksik step tanımı veya sürüm uyumsuzluğu)."
fi

# ---------------------------------------------------------------- Özet
echo -e "--------------------------------------"
echo -e "OS:             $OS"
echo -e "Node Version:   $(node -v)"
echo -e "Appium Version: $(appium -v)"
echo -e "Playwright:     $INSTALLED_PW (playwright-bdd $INSTALLED_BDD)"
if [[ "$WARNINGS" -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Kurulum $WARNINGS uyarı ile tamamlandı. Yukarıdaki uyarıları kontrol edin.${NC}"
else
    echo -e "${GREEN}🚀 Setup complete!${NC}"
fi
echo -e "--------------------------------------"

if $START_APPIUM; then
    echo -e "Starting Appium Server..."
    exec appium --address 127.0.0.1 --port 4723
else
    echo -e "Appium'u başlatmak için: appium --address 127.0.0.1 --port 4723"
    echo -e "Testleri çalıştırmak için (ayrı terminalde): npm test"
    echo -e "Raporu açmak için: npm run report"
fi
