import { BasePage } from './BasePage';
import { OtpLocators } from '../locators/otpLocators';

export class OtpPage extends BasePage {

    async enterOtpCode(otp: string) {
        await this.click(OtpLocators.otpFirstBox);   // get() ile 30 sn bekler, sonra tiklar
        await this.driver.pause(500);                 // klavyenin acilmasi icin kisa bekleme
        await this.driver.keys(otp.split(''));
        this.log(`OTP girildi: ${otp}`);
    }
}
