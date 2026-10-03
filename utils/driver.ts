import { remote, Browser } from 'webdriverio';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

/**
 * Appium bağlantısı. Makineye göre değişen tüm değerler .env'den okunur
 * (bkz. .env.example); boş bırakılanlar için aşağıdaki varsayılanlar kullanılır.
 */

// Seferci uygulamasının kimliği — herkes için aynı.
const APP_PACKAGE = process.env.APP_PACKAGE || 'com.hafriyat.mobile';
const APP_ACTIVITY = process.env.APP_ACTIVITY || '.MainActivity';

const env = (name: string) => (process.env[name] || '').trim();

/**
 * APP_PATH verilmişse APK'nın tam yolunu döndürür. Göreli yollar proje klasörüne
 * göre çözülür; böylece aynı .env değeri Windows, macOS ve Linux'ta çalışır.
 */
function resolveApkPath(): string | undefined {
    const appPath = env('APP_PATH');
    if (!appPath) return undefined;

    const fullPath = path.resolve(process.cwd(), appPath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(
            `❌ APK bulunamadı: ${fullPath}\n` +
            `   .env içindeki APP_PATH değerini kontrol edin veya APK'yı apps/ klasörüne koyun.\n` +
            `   Cihazda kurulu uygulamayı kullanmak için APP_PATH'i boş bırakın.`
        );
    }
    return fullPath;
}

async function getBrowserStackDriver(): Promise<Browser> {
    console.log('🌐 Connecting to BrowserStack...');

    const missing = ['BS_USERNAME', 'BS_ACCESS_KEY', 'BS_APP_URL'].filter((name) => !env(name));
    if (missing.length > 0) {
        throw new Error(
            `❌ .env içinde eksik BrowserStack değerleri: ${missing.join(', ')}\n` +
            `   BS_APP_URL için APK'yı yükleyin: npm run upload:bs`
        );
    }

    return remote({
        protocol: 'https',
        hostname: 'hub.browserstack.com',
        port: 443,
        path: '/wd/hub',
        capabilities: {
            platformName: 'android',
            'appium:automationName': 'UiAutomator2',
            'appium:app': env('BS_APP_URL'),
            'appium:autoGrantPermissions': true,
            'bstack:options': {
                userName: env('BS_USERNAME'),
                accessKey: env('BS_ACCESS_KEY'),
                deviceName: env('BS_DEVICE') || 'Samsung Galaxy S20',
                osVersion: env('BS_OS_VERSION') || undefined,

                projectName: 'Seferci',
                buildName: env('BS_BUILD_NAME') || 'Regression Suite',

                debug: true,
                networkLogs: true,
                appiumLogs: true,
                video: true,
                appiumVersion: '2.0.1',
            },
        } as WebdriverIO.Capabilities,
    });
}

async function getLocalDriver(): Promise<Browser> {
    const hostname = env('APPIUM_HOST') || '127.0.0.1';
    const port = Number(env('APPIUM_PORT') || 4723);
    const apkPath = resolveApkPath();
    const udid = env('DEVICE_UDID');

    console.log(
        `📱 Running tests on Local Appium (${hostname}:${port})` +
        (udid ? `, device ${udid}` : '') +
        (apkPath ? `, APK ${path.basename(apkPath)}` : ', installed app')
    );

    return remote({
        protocol: 'http',
        hostname,
        port,
        path: '/',
        capabilities: {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:autoGrantPermissions': true,
            'appium:appPackage': APP_PACKAGE,
            'appium:appActivity': APP_ACTIVITY,
            'appium:noReset': false,
            // APK verilmişse Appium kurar (kuruluysa ve aynı sürümse tekrar kurmaz).
            ...(apkPath && { 'appium:app': apkPath }),
            // Birden fazla cihaz bağlıysa hangisinin kullanılacağı (adb devices).
            ...(udid && { 'appium:udid': udid }),
        },
    });
}

export async function getDriver(): Promise<Browser> {
    return (env('RUN_ENV') || 'local') === 'bs' ? getBrowserStackDriver() : getLocalDriver();
}
