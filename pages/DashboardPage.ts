import { BasePage } from './BasePage';
import { DashboardLocators } from '../locators/dashboardLocators';
import { LoginLocators } from '../locators/loginLocators';

export class DashboardPage extends BasePage {

    /**
     * Login adımının çağırdığı metot (dashboard.steps.ts). Gerçek doğrulama
     * verifyDashboardDisplayed() içinde yapılır.
     */
    async merhabaVisible() {
        await this.verifyDashboardDisplayed();
    }

    async isDashboardVisible(): Promise<boolean> {
        const merhaba = await this.driver.$(DashboardLocators.merhaba);
        return await merhaba.isDisplayed().catch(() => false);
    }

    /**
     * Login sonrası doğrulama: varsa popup kapatılır, "Merhaba" görünmeli ve
     * login ekranından çıkılmış olmalı. Koşullardan biri sağlanmazsa step fail olur.
     */
    async verifyDashboardDisplayed() {
        // Login sonrası popup çıkarsa kapat; çıkmazsa 3 sn bekleyip devam eder.
        const popup = await this.driver.$(DashboardLocators.popup);
        const popupVisible = await popup
            .waitForDisplayed({ timeout: 3000 })
            .then(() => true)
            .catch(() => false);

        if (popupVisible) {
            this.log('Popup görüldü, geri tuşuyla kapatılıyor');
            await this.driver.back();
        }

        const merhaba = await this.driver.$(DashboardLocators.merhaba);
        await merhaba.waitForDisplayed({
            timeout: 20000,
            timeoutMsg: '❌ Login başarısız: "Merhaba" 20 sn içinde görünmedi',
        });

        const phoneInput = await this.driver.$(LoginLocators.phoneNumberInput);
        await phoneInput.waitForDisplayed({
            timeout: 5000,
            reverse: true,
            timeoutMsg: '❌ Login başarısız: hâlâ telefon numarası ekranında',
        });

        this.log('✅ Login doğrulandı: "Merhaba" görüntülendi');
    }

    async clickHome() {
        const home = await this.driver.$(DashboardLocators.home);
        await home.waitForDisplayed({ timeout: 10000 });
        await home.click();

        console.log('🏠 User clicked Home (Anasayfa)');
    }
}
