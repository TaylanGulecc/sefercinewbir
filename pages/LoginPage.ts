import { BasePage } from './BasePage';
import { LoginLocators } from '../locators/loginLocators';

export class LoginPage extends BasePage {

  async enterPhoneNumber(phoneNumber: string) {
    await this.fill(LoginLocators.phoneNumberInput, phoneNumber);
  }

  async clickKvkkCheckboxButton() {
    await this.click(LoginLocators.kvkkCheckboxButton);
  }

  async clickGirisKoduGonderButton() {
    await this.click(LoginLocators.girisKoduGonderButton);
  }

  async clickOnEmptyArea() {
    // Sabit piksel yerine ekran boyutuna oranlı nokta: farklı çözünürlükteki
    // emülatör/cihazlarda da aynı bölgeye dokunur. (1080x2400 ekranda 540, 2200)
    const { width, height } = await this.driver.getWindowSize();
    const x = Math.floor(width * 0.5);
    const y = Math.floor(height * 0.916);

    this.log(`🎯 Clicking on empty area at [${x}, ${y}] (screen ${width}x${height})`);

    await this.driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);

    await this.driver.releaseActions();
    await this.driver.pause(1000);
  }
}
