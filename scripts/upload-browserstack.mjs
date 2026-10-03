// APK'yı BrowserStack App Automate'e yükler ve dönen bs://... adresini yazdırır.
//
// Kullanım:
//   npm run upload:bs                        -> APP_PATH'teki APK'yı yükler, BS_APP_URL'i .env'e yazar
//   node scripts/upload-browserstack.mjs apps/seferci-2.4.1.apk   -> belirli bir dosyayı yükler
//   node scripts/upload-browserstack.mjs --no-save                -> .env'e yazmaz, yalnızca yazdırır
//
// Gerekenler (.env): BS_USERNAME, BS_ACCESS_KEY ve (dosya verilmezse) APP_PATH

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const UPLOAD_URL = process.env.BS_UPLOAD_URL || 'https://api-cloud.browserstack.com/app-automate/upload';
// Aynı custom_id ile yüklenen son APK'ya BS_APP_URL=Seferci şeklinde de erişilebilir.
const CUSTOM_ID = 'Seferci';

const args = process.argv.slice(2);
const save = !args.includes('--no-save');
const fileArg = args.find((a) => !a.startsWith('--'));

function fail(message) {
    console.error(`❌ ${message}`);
    process.exit(1);
}

const user = (process.env.BS_USERNAME || '').trim();
const key = (process.env.BS_ACCESS_KEY || '').trim();
if (!user || !key) fail('.env içinde BS_USERNAME ve BS_ACCESS_KEY tanımlı olmalı.');

const apkArg = fileArg || (process.env.APP_PATH || '').trim();
if (!apkArg) fail('Yüklenecek APK belirtilmedi. .env içine APP_PATH yazın veya dosya yolunu parametre olarak verin.');

const apkPath = path.resolve(process.cwd(), apkArg);
if (!fs.existsSync(apkPath)) fail(`APK bulunamadı: ${apkPath}`);

const sizeMb = (fs.statSync(apkPath).size / 1024 / 1024).toFixed(1);
console.log(`⬆️  Uploading ${path.basename(apkPath)} (${sizeMb} MB) to BrowserStack...`);

const form = new FormData();
form.append('file', await fs.openAsBlob(apkPath), path.basename(apkPath));
form.append('custom_id', CUSTOM_ID);

let response;
try {
    response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { Authorization: 'Basic ' + Buffer.from(`${user}:${key}`).toString('base64') },
        body: form,
    });
} catch (e) {
    fail(`BrowserStack'e bağlanılamadı: ${e.message}`);
}

const text = await response.text();
let body;
try {
    body = JSON.parse(text);
} catch {
    body = {};
}

if (!response.ok || !body.app_url) {
    fail(`Yükleme başarısız (HTTP ${response.status}): ${body.error || text.slice(0, 300)}`);
}

console.log(`✅ Yüklendi: ${body.app_url}  (custom_id: ${body.custom_id || CUSTOM_ID})`);

if (!save) {
    console.log(`   .env içine şunu yazın: BS_APP_URL=${body.app_url}`);
    process.exit(0);
}

const envPath = path.resolve(process.cwd(), '.env');
let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const line = `BS_APP_URL=${body.app_url}`;
envText = /^BS_APP_URL=.*$/m.test(envText)
    ? envText.replace(/^BS_APP_URL=.*$/m, line)
    : envText + (envText && !envText.endsWith('\n') ? '\n' : '') + line + '\n';
fs.writeFileSync(envPath, envText);
console.log(`📝 .env güncellendi: ${line}`);
