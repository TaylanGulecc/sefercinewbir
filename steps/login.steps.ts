import { When } from '../fixtures';

When('user enters {string} phone number information', async ({ loginPage }, phonenumber: string) => {
    await loginPage.enterPhoneNumber(phonenumber);
    console.log(`✅ Phone number entered: ${phonenumber}`);
});

When('user clicks kvkk checkbox button', async ({ loginPage }) => {
    await loginPage.clickKvkkCheckboxButton();
    console.log('✅ KVKK checkbox clicked');
});

When('user clicks giris kodu gonder button', async ({ loginPage }) => {
    await loginPage.clickGirisKoduGonderButton();
    console.log('✅ giris kodu gonder button clicked');
});

When('user enters {string} otp code', async ({ otpPage }, otp: string) => {
    await otpPage.enterOtpCode(otp);
    console.log(`✅ OTP entered: ${otp}`);
});

When('user clicks on an empty area', async ({ loginPage }) => {
    await loginPage.clickOnEmptyArea();
    console.log('✅ Clicked on empty area (bottom section) to dismiss popup.');
});
