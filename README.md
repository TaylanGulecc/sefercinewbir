# sefercinewbir — Seferci Mobil Test Otomasyonu

Seferci Android uygulaması için uçtan uca (E2E) mobil test projesi.

| Katman | Araç |
|---|---|
| Dil | TypeScript (Node.js 20) |
| Uygulamayı sürme | **Appium 2** + UiAutomator2, **WebdriverIO** istemcisi |
| Test koşturucu | **Playwright Test** (rapor, retry, paralel çalıştırma) |
| Senaryo yazımı | Gherkin `.feature` dosyaları, **playwright-bdd** ile |

> Playwright burada yalnızca **test koşturucu** olarak kullanılır. Seferci native bir
> uygulama olduğu için ekranlar Appium üzerinden sürülür; Playwright'ın tarayıcıya
> özgü özellikleri (trace viewer, codegen, `page` nesnesi) bu projede kullanılmaz.

---

## 📌 Sürümler

Bu sürümler birlikte çalıştığı doğrulanmış kombinasyondur. Farklı sürüm kullanmak hataya yol açar.

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | **20.19.6** | Başka ana sürümler (ör. Node 25) desteklenmez; kurulum script'i durur |
| `@playwright/test` | **1.57.0** (sabit, `^` yok) | `playwright-bdd` Playwright'ın iç modüllerini kullanır; daha yeni sürüm `bddgen`'i bozar |
| `playwright-bdd` | 8.x | |
| Appium | 2.x | BrowserStack tarafındaki `appiumVersion` ile aynı ana sürüm |
| UiAutomator2 driver | Appium'un kurduğu güncel sürüm | |
| Java JDK | 17 | UiAutomator2 ve Android araçları için |

Sürümleri değiştirmeden önce aşağıdaki **🔄 Bağımlılıkları güncelleme** bölümüne bakın.

---

## Klasör yapısı

```
features/            Gherkin senaryoları (.feature)
steps/               Step tanımları (Given/When/Then)
pages/               Page Object'ler (ekran başına bir sınıf)
locators/            Ekran başına XPath / id locator'ları
fixtures.ts          Appium session'ı ve page nesnelerini her senaryoya sağlar
utils/driver.ts      Appium bağlantısı ve capabilities (local / BrowserStack) — ayarlar .env'den
apps/                Test edilecek APK (git'e eklenmez, bkz. apps/README.md)
scripts/             Yardımcı komutlar (APK'yı BrowserStack'e yükleme)
playwright.config.ts Koşturucu ayarları (timeout, workers, retry, rapor)
.features-gen/       bddgen'in ürettiği testler (otomatik oluşur, düzenlemeyin)
```

Akış: `.feature` → `bddgen` Playwright testlerine çevirir → step'ler → page'ler → Appium → cihaz.

### Mevcut kapsam

Proje şu an yalnızca Seferci **login** akışını kapsar. Taksitlio projesinden taşınan
(yeni başvuru, ürün listeleme, müşteri dokümanları, ek işlemler, API) step, page ve locator'lar kaldırılmıştır.

| Katman | Dosyalar |
|---|---|
| Senaryo | `features/app-launch.feature` |
| Step | `steps/login.steps.ts`, `steps/dashboard.steps.ts` |
| Page | `pages/BasePage.ts`, `pages/LoginPage.ts`, `pages/OtpPage.ts`, `pages/DashboardPage.ts` |
| Locator | `locators/loginLocators.ts`, `locators/otpLocators.ts`, `locators/dashboardLocators.ts` |

Login doğrulaması (`DashboardPage.verifyDashboardDisplayed`): ana sayfadaki **"Merhaba"** metni
20 sn içinde görünmeli ve telefon numarası alanı ekrandan kalkmış olmalıdır; aksi halde step fail olur.

---

## 🚀 Hızlı kurulum

Ön koşullar: **Java JDK 17**, **Android Studio** (SDK + Platform Tools + Emulator).
Geri kalanını (Node 20.19.6, Appium 2, UiAutomator2, `npm install`) kurulum script'i yapar
ve eksik ortam ayarlarını raporlar.

| İşletim sistemi | Komut (proje klasöründe) |
|---|---|
| macOS / Linux | `./appiumInstallation.sh` |
| Windows | `powershell -ExecutionPolicy Bypass -File .\appiumInstallation.ps1` |

Seçenekler: `--start` / `-Start` kurulumdan sonra Appium'u başlatır; `--ios` (yalnızca macOS) XCUITest driver'ını da kurar.

Script sırasıyla şunları yapar; kurulu olanı atlar, tekrar çalıştırmak güvenlidir:

1. Node 20.19.6'yı kurar/etkinleştirir (macOS/Linux: nvm, Windows: nvm-windows)
2. Appium 2 ve UiAutomator2 driver'ını kurar
3. `JAVA_HOME`, `ANDROID_HOME`, `adb` ve bağlı cihazı kontrol eder (eksikse uyarır)
4. `npm install` çalıştırır
5. Kurulu Playwright sürümünün `package.json`'daki sabit sürümle aynı olduğunu doğrular
6. `.env` yoksa `.env.example`'dan oluşturur
7. `APP_PATH`'teki APK'nın var olduğunu kontrol eder (yoksa uyarır)
8. `bddgen` ile senaryoları üretir — cihaz gerektirmez; step eşleşmelerini ve sürüm uyumunu doğrular

Kırmızı `❌` / `[HATA]` satırında script durur ve düzeltme komutunu gösterir. Sarı uyarılar
kurulumu durdurmaz, sonda sayılarıyla listelenir.

### Windows notları

- nvm-windows yoksa: `winget install CoreyButler.NVMforWindows`, ardından **yeni** bir terminal açın.
- `nvm use` yönetici yetkisi isteyebilir → PowerShell'i "Yönetici olarak çalıştır" ile açın.
- `appiumInstallation.ps1` **UTF-8 BOM** ile kayıtlıdır. Editörde BOM'suz kaydederseniz
  Windows PowerShell 5.1'de Türkçe karakterler bozulur.

### Script kullanmadan (elle) kurulum

```bash
nvm install 20.19.6 && nvm use 20.19.6
npm install -g appium@2
appium driver install uiautomator2
npm install
cp .env.example .env   # Windows: copy .env.example .env — ardından APP_PATH vb. doldurun
npx bddgen             # kurulumun doğru olduğunu cihaz olmadan kontrol eder
```

### Ortam değişkenleri

| Değişken | macOS | Linux | Windows |
|---|---|---|---|
| `ANDROID_HOME` | `~/Library/Android/sdk` | `~/Android/Sdk` | `%LOCALAPPDATA%\Android\Sdk` |
| `JAVA_HOME` | JDK kurulum klasörü | JDK kurulum klasörü | JDK kurulum klasörü |

`PATH`'e `$ANDROID_HOME/platform-tools` ve `$ANDROID_HOME/emulator` eklenmelidir.

### `.env`

`.env.example` dosyasını `.env` olarak kopyalayın (kurulum script'i yoksa kendisi oluşturur). `.env` git'e eklenmez.
Makineye göre değişen **her şey** buradadır; kodda kişiye özel yol veya ayar yoktur. Boş bırakılan değerler için varsayılan kullanılır.

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `RUN_ENV` | `local` | `local` (bilgisayardaki Appium) veya `bs` (BrowserStack) |
| `WORKERS` | `1` | Aynı anda koşacak senaryo sayısı (her biri ayrı cihaz ister) |
| `APP_PATH` | — (boş) | Test edilecek APK, ör. `./apps/seferci.apk`. Boşsa cihazda kurulu uygulama kullanılır |
| `APP_PACKAGE` / `APP_ACTIVITY` | `com.hafriyat.mobile` / `.MainActivity` | Uygulama kimliği; normalde değiştirilmez |
| `APPIUM_HOST` / `APPIUM_PORT` | `127.0.0.1` / `4723` | Appium sunucusunun adresi |
| `DEVICE_UDID` | — | Birden fazla cihaz bağlıysa kullanılacak olan (`adb devices` → ör. `emulator-5554`) |
| `BS_USERNAME`, `BS_ACCESS_KEY` | — | BrowserStack hesabı (yalnızca `bs`) |
| `BS_APP_URL` | — | BrowserStack'teki uygulama (`bs://...`); `npm run upload:bs` doldurur |
| `BS_DEVICE` / `BS_OS_VERSION` | `Samsung Galaxy S20` / — | BrowserStack cihazı |
| `BS_BUILD_NAME` | `Regression Suite` | BrowserStack panelinde görünen build adı |

> Appium'u farklı bir portta çalıştırıyorsanız `APPIUM_PORT` ile birlikte Appium'u da o portla başlatın
> (`appium --port <port>`); kurulum script'inin `--start` seçeneği her zaman 4723 kullanır.

---

## 📦 Uygulama (APK) ve cihaz

### APK'yı temin etme

APK dosyaları **git'e eklenmez** (`.gitignore`: `apps/*.apk`) — büyük ikili dosyalardır ve her sürümde depoyu şişirir.

1. Güncel Seferci APK'sını ekibin ortak dosya alanından indirin.
2. `apps/` klasörüne koyun, ör. `apps/seferci.apk` (hangi sürümü test ettiğinizi not edin: `seferci-2.4.1.apk`).
3. `.env` içinde gösterin: `APP_PATH=./apps/seferci.apk`

Göreli yol proje klasörüne göre çözülür ve `/` ile yazılır; aynı değer Windows, macOS ve Linux'ta çalışır.

### Local çalıştırma

1. Emülatörü açın (Android Studio → Device Manager) ve kontrol edin: `adb devices`
2. `npm test` — **Appium APK'yı cihaza kendisi kurar** (`APP_PATH` doluysa). Uygulama aynı sürümle zaten kuruluysa tekrar kurmaz.

| `APP_PATH` | Davranış |
|---|---|
| Dolu ve dosya var | Appium APK'yı kurar (gerekirse) ve başlatır |
| Dolu ama dosya yok | Test başlamadan net bir hata verir: `❌ APK bulunamadı: ...` |
| Boş | Cihazda önceden kurulu uygulama kullanılır (`adb install -r apps/seferci.apk` ile elle kurulmuş olmalı) |

`noReset: false` olduğu için uygulama verisi her senaryoda sıfırlanır (APK yeniden kurulmaz).
Paket/activity doğrulamak için uygulama açıkken: `adb shell dumpsys window | grep mCurrentFocus`
(Windows: `findstr` ile).

Birden fazla cihaz/emülatör bağlıysa `.env` içinde `DEVICE_UDID` ile hangisinin kullanılacağını belirtin.

### BrowserStack

BrowserStack cihazları sizin bilgisayarınızdaki APK'yı göremez; APK'nın önce BrowserStack'e yüklenmesi gerekir:

```bash
npm run upload:bs
```

Bu komut `APP_PATH`'teki APK'yı yükler ve dönen `bs://...` adresini `.env` içindeki `BS_APP_URL`'e yazar.
Başka bir dosya için: `node scripts/upload-browserstack.mjs apps/seferci-2.4.1.apk`
(`.env`'e yazmadan yalnızca göstermek için `--no-save`). **Her yeni APK sürümünde** tekrarlayın.

APK'lar `custom_id: Seferci` ile yüklenir; `BS_APP_URL=Seferci` yazarsanız her zaman en son yüklenen APK kullanılır
(ekipte biri yükleyince herkes otomatik olarak yeni sürümü test eder).

### Prod build hakkında

Şu an elimizde yalnızca **prod** build var: testler gerçek sunuculara gider ve gerçek SMS/OTP akışını tetikler.
Bu yüzden sabit OTP (`699160`) çalışmayabilir. Uzun vadede test/staging build'i ve test OTP'si talep edilmelidir.

---

## ▶️ Testleri çalıştırma

Appium ayrı bir terminalde açık olmalı: `appium --address 127.0.0.1 --port 4723`

```bash
npm test                          # tüm senaryolar
npm test -- --grep "@smoke"       # yalnızca @smoke etiketli senaryolar (feature'lara etiket eklendiğinde)
npm test -- --grep "Giris yap"    # adına göre tek senaryo
npm run test:bs                   # BrowserStack üzerinde
npm run report                    # HTML raporu tarayıcıda aç
```

| npm komutu | Ne yapar |
|---|---|
| `npm test` | `bddgen` + `playwright test` |
| `npm run test:bs` | Aynısı, `RUN_ENV=bs` ile |
| `npm run bddgen` | Yalnızca `.feature` → test üretimi (cihaz gerekmez) |
| `npm run report` | Son HTML raporunu açar |
| `npm run upload:bs` | APK'yı BrowserStack'e yükler, `BS_APP_URL`'i `.env`'e yazar |
| `npm run typecheck` | TypeScript tip kontrolü (yanlış fixture adı, hatalı import vb.) |

Feature dosyasındaki etiketler (`@smoke` vb.) Playwright etiketlerine dönüşür ve `--grep` ile filtrelenir.

- **Rapor:** `playwright-report/`. Başarısız senaryolarda ekran görüntüsü ve ekranın XML'i rapora eklenir.
- **Retry:** CI'da (`CI=true`) başarısız senaryo 1 kez tekrar denenir; local'de denenmez.
- **Paralel:** Her worker ayrı Appium session'ı, yani **ayrı cihaz** ister. Tek emülatörde `WORKERS=1`.

---

## 🔍 Appium Inspector

İndirme: https://github.com/appium/appium-inspector/releases

| Alan | Değer |
|---|---|
| Remote Host | `127.0.0.1` |
| Remote Port | `4723` |
| Remote Path | `/` (Appium 2'de `/wd/hub` **değil**) |

Capabilities:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:appPackage": "com.hafriyat.mobile",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": true
}
```

Inspector'da `noReset: true` kullanmak, uygulamayı mevcut durumuyla incelemenizi sağlar.

---

## ✍️ Yeni test ekleme

1. **Locator** — `locators/<ekran>Locators.ts` (Inspector'dan; mümkünse `resource-id` / `content-desc`)
2. **Page** — `pages/<Ekran>Page.ts`, `BasePage`'den türetin; her metotta `await` kullanın
3. **Fixture** — yeni page'i `fixtures.ts` içindeki `Fixtures` tipine ve `base.extend` listesine ekleyin
4. **Step** — `steps/<alan>.steps.ts`:
   ```ts
   import { When } from '../fixtures';

   When('user enters {string} phone number information', async ({ loginPage }, phone: string) => {
       await loginPage.enterPhoneNumber(phone);
   });
   ```
5. **Senaryo** — `features/*.feature` dosyasına Gherkin adımlarını yazın

Step'lerde kullanılan fixture adı (`loginPage`) `fixtures.ts`'teki adla aynı olmalıdır; TypeScript yanlış adı derleme sırasında yakalar.

---

## ❌ Sık karşılaşılan hatalar

| Hata | Sebep / Çözüm |
|---|---|
| `ECONNREFUSED 127.0.0.1:4723` | Appium açık değil → `appium` |
| `Could not find a connected Android device` | Emülatör kapalı → `adb devices` |
| `JAVA_HOME` / `ANDROID_HOME is not set` | Ortam değişkenlerini ayarlayın (yukarıdaki tablo) |
| `Element not found: ...` | Locator yanlış veya ekran farklı → Inspector'da doğrulayın |
| `Login başarısız: "Merhaba" 20 sn içinde görünmedi` | Login gerçekten başarısız (çoğunlukla OTP) ya da `locators/dashboardLocators.ts` → `merhaba` locator'ı ana sayfayla eşleşmiyor → Inspector'da doğrulayın |
| `Login başarısız: hâlâ telefon numarası ekranında` | "Merhaba" bulundu ama login ekranından çıkılmadı → OTP adımını ve locator'ı kontrol edin |
| `APK bulunamadı: ...` | `APP_PATH` yanlış veya APK `apps/`'a konmamış → yolu kontrol edin ya da boş bırakın |
| `App with package com.hafriyat.mobile ... not installed` | `APP_PATH` boş ve uygulama cihazda yok → APK'yı `APP_PATH`'e yazın veya `adb install -r` ile kurun |
| `eksik BrowserStack değerleri: BS_APP_URL` | `npm run upload:bs` çalıştırın |
| `Missing step definition` (bddgen) | Feature'daki adım metni bir step tanımıyla birebir eşleşmiyor |
| `Cannot destructure property 'registerESMLoader' ...` (bddgen) | Kurulu Playwright, `playwright-bdd` ile uyumsuz → `npm install -D @playwright/test@1.57.0 --save-exact` |
| `bddgen` / `npm test` beklenmedik modül hataları | Node sürümü yanlış → `node -v` **v20.x** olmalı; `nvm use 20.19.6` |
| `running scripts is disabled on this system` (Windows) | `.ps1`'i doğrudan değil, `powershell -ExecutionPolicy Bypass -File .\appiumInstallation.ps1` ile çalıştırın |
| `.ps1` çıktısında Türkçe karakterler bozuk | Dosya BOM'suz kaydedilmiş → editörde "UTF-8 with BOM" olarak kaydedin |

Kurulum sorunlarında önce `npx bddgen` çalıştırın: Appium ve cihaz olmadan sürüm ve step sorunlarını gösterir.

---

## 🔄 Bağımlılıkları güncelleme

`@playwright/test` ve `playwright-bdd` **birlikte** güncellenmelidir; biri tek başına güncellenirse `bddgen` bozulabilir.

1. `playwright-bdd`'nin desteklediği Playwright aralığına bakın:
   ```bash
   npm view playwright-bdd peerDependencies
   ```
2. İkisini birlikte, Playwright'ı yine **sabit** sürümle güncelleyin:
   ```bash
   npm install -D playwright-bdd@<sürüm> @playwright/test@<sürüm> --save-exact
   ```
3. `npx bddgen` ve ardından `npm test` ile doğrulayın.
4. `package.json` ve `package-lock.json`'u commit edin. Kurulum script'leri beklenen Playwright sürümünü `package.json`'dan okur; script'lere dokunmak gerekmez.

Node sürümünü değiştirmek için `appiumInstallation.sh` / `.ps1` içindeki `NODE_VERSION` / `$NodeVersion` değerini ve bu README'deki sürüm tablosunu güncelleyin.

---

## ⚠️ Bilinen eksikler

- Login senaryosundaki telefon numarası ve OTP (`699160`) feature dosyasında sabittir. Prod build'de
  gerçek SMS gönderilir ve OTP her seferinde değişebilir; test ortamı için sabit test OTP'si veya
  OTP okuma çözümü gerekir. Bu değerlerin `.env`'e taşınması planlanmalıdır.
- `features/app-launch.feature` içindeki "Şoför profil bilgilerinin görüntülenmesi ve güncellenmesi"
  senaryosu şu an yalnızca login adımlarını içerir; profil adımları henüz yazılmamıştır.
- `merhaba` locator'ı `contains(@text,"Merhaba")` ile eşleşir. Login veya OTP ekranında da "Merhaba"
  geçen bir metin varsa, ana sayfaya özgü ikinci bir element (ör. `profile`) ile doğrulama güçlendirilmelidir.
- Feature'larda henüz `@smoke` / `@regression` etiketi yoktur.

---

## CI / Docker

`Dockerfile` testleri `npm test` ile çalıştırır. `DevOps-CoE.yml` (Azure DevOps) imajı derleyip
BrowserStack'e karşı koşturur ve `playwright-report` klasörünü artifact olarak yayınlar.
`BS_USERNAME` / `BS_ACCESS_KEY` pipeline'da **gizli değişken** olarak tanımlanmalıdır.
Pipeline varsayılan olarak `BS_APP_URL=Seferci` ile BrowserStack'e **en son yüklenen** APK'yı test eder;
yeni sürümü test etmeden önce `npm run upload:bs` ile yükleyin.
