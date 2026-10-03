import { When, Then } from '../fixtures';

// Ekrandan bağımsız, metne göre tıklama step'leri (BasePage.clickByText).
// Metin hem `text` hem `content-desc` özelliğinde aranır.
//
// Örnek:
//   When user clicks "Profil" text
//   When user clicks text containing "Merhaba"
//   When user scrolls and clicks "Çıkış Yap" text
//   Then user sees "Profil" text
//   Then user sees text containing "Merhaba"
//   Then user scrolls and sees "Çıkış Yap" text
//   Then user does not see "Giriş Kodu Gönder" text
//   Then "Firma Adı" field value should be "Test"
//   Then user scrolls and "Firma Adı" field value should be "Test"
//   When user enters "Yeni Firma" into "Firma Adı" field
//   When user clicks "Geç" button next to "Şoför" text
//   When user scrolls and clicks "Geç" button next to "Şoför" text
//   When user closes keyboard

When('user clicks {string} text', async ({ basePage }, text: string) => {
    await basePage.clickByText(text);
});

When('user clicks text containing {string}', async ({ basePage }, text: string) => {
    await basePage.clickByPartialText(text);
});

When('user scrolls and clicks {string} text', async ({ basePage }, text: string) => {
    await basePage.clickByText(text, { maxSwipes: 5 });
});

Then('user sees {string} text', async ({ basePage }, text: string) => {
    await basePage.verifyTextVisible(text);
});

Then('user sees text containing {string}', async ({ basePage }, text: string) => {
    await basePage.verifyTextVisible(text, { exact: false });
});

Then('user scrolls and sees {string} text', async ({ basePage }, text: string) => {
    await basePage.verifyTextVisible(text, { maxSwipes: 5 });
});

Then('user does not see {string} text', async ({ basePage }, text: string) => {
    await basePage.verifyTextNotVisible(text);
});

// Üstte etiket/altında textbox veya solda etiket/sağında değer olan alanlar için (BasePage.verifyFieldValue).
Then('{string} field value should be {string}', async ({ basePage }, label: string, expected: string) => {
    await basePage.verifyFieldValue(label, expected);
});

Then('user scrolls and {string} field value should be {string}', async ({ basePage }, label: string, expected: string) => {
    await basePage.verifyFieldValue(label, expected, { maxSwipes: 5 });
});

// Üstte etiket, altında textbox olan alana metin yazar (BasePage.fillField).
// Mevcut değer silinir, yazılan değer kontrol edilir.
When('user enters {string} into {string} field', async ({ basePage }, text: string, label: string) => {
    await basePage.fillField(label, text);
});

When('user scrolls and enters {string} into {string} field', async ({ basePage }, text: string, label: string) => {
    await basePage.fillField(label, text, { maxSwipes: 5 });
});

// Verilen metnin satırındaki, sağda duran butona tıklar (BasePage.clickNextTo).
// Aynı adlı birden fazla buton olduğunda (her rol satırında bir "Geç") doğru satırınkini seçer.
When('user clicks {string} button next to {string} text', async ({ basePage }, button: string, nextTo: string) => {
    await basePage.clickNextTo(button, nextTo);
});

When('user scrolls and clicks {string} button next to {string} text', async ({ basePage }, button: string, nextTo: string) => {
    await basePage.clickNextTo(button, nextTo, { maxSwipes: 5 });
});


// Açık klavyeyi "Done" ile kapatır (geri tuşu kullanılmaz, form kapanmaz).
// Not: Görünmeyen bir metne tıklama/doğrulama adımları klavyeyi zaten otomatik kapatır.
When('user closes keyboard', async ({ basePage }) => {
    await basePage.closeKeyboard();
});
