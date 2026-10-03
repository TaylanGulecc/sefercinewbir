import { test as base, createBdd } from 'playwright-bdd';
import type { Browser } from 'webdriverio';

import { getDriver } from './utils/driver';
import { BasePage } from './pages/BasePage';
import { LoginPage } from './pages/LoginPage';
import { OtpPage } from './pages/OtpPage';
import { DashboardPage } from './pages/DashboardPage';

type Fixtures = {
    driver: Browser;
    basePage: BasePage;
    loginPage: LoginPage;
    otpPage: OtpPage;
    dashboardPage: DashboardPage;
};

const isBrowserStack = () => (process.env.RUN_ENV || 'local') === 'bs';

// BrowserStack executor komutu JSON bekler; tırnak/satır sonu içeren mesajlar
// JSON'u bozmasın diye JSON.stringify kullanılır.
async function browserStackExecutor(driver: Browser, action: string, args: Record<string, string>) {
    await driver.execute(`browserstack_executor: ${JSON.stringify({ action, arguments: args })}`);
}

export const test = base.extend<Fixtures>({
    // Her senaryo kendi Appium session'ını açar ve senaryo bitince kapatır
    // (Cucumber'daki Before/After hook'larının karşılığı).
    driver: async ({}, use, testInfo) => {
        const driver = await getDriver();

        if (isBrowserStack()) {
            await browserStackExecutor(driver, 'setSessionName', { name: testInfo.title })
                .catch(() => console.warn('⚠️ BrowserStack session name could not be set'));
        }

        await use(driver);

        const failed = testInfo.status !== testInfo.expectedStatus;

        // Başarısız senaryoda ekran görüntüsünü ve ekran XML'ini HTML rapora ekle.
        if (failed) {
            try {
                const screenshot = await driver.takeScreenshot();
                await testInfo.attach('screenshot', {
                    body: Buffer.from(screenshot, 'base64'),
                    contentType: 'image/png',
                });
                await testInfo.attach('page-source', {
                    body: await driver.getPageSource(),
                    contentType: 'text/xml',
                });
            } catch (e) {
                console.warn('⚠️ Failure evidence could not be captured');
            }
        }

        if (isBrowserStack()) {
            const reason = (testInfo.error?.message || 'Execution completed').slice(0, 250);
            await browserStackExecutor(driver, 'setSessionStatus', {
                status: failed ? 'failed' : 'passed',
                reason,
            }).catch(() => console.warn('⚠️ BrowserStack status could not be updated'));
        }

        try {
            await driver.deleteSession();
        } catch (error: any) {
            console.log(`ℹ️ Session was already closed: ${error.message}`);
        }
    },

    // Page nesneleri yalnızca bir step onları kullandığında oluşturulur ve
    // aynı senaryo içinde tek bir örnek paylaşılır.
    // Ekrandan bağımsız ortak işlemler (metne göre tıklama vb.) için; bkz. steps/common.steps.ts
    basePage: async ({ driver }, use) => use(new BasePage(driver)),
    loginPage: async ({ driver }, use) => use(new LoginPage(driver)),
    otpPage: async ({ driver }, use) => use(new OtpPage(driver)),
    dashboardPage: async ({ driver }, use) => use(new DashboardPage(driver)),
});

export const { Given, When, Then } = createBdd(test);
