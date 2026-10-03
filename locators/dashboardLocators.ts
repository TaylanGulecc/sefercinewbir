export const DashboardLocators = {
    // Seferci ana sayfası
    merhaba: '//android.widget.TextView[contains(@text,"Merhaba")]',
    profile: '//android.widget.TextView[@text="Profil"]',
    home: '//android.view.ViewGroup[@content-desc="Anasayfa"]',

    // Login sonrası popup — Taksitlio'dan kalma; Seferci'deki gerçek popup
    // locator'ı Appium Inspector'dan alınıp buraya yazılmalı.
    popup: '//android.widget.ImageView[@content-desc="popup"]',
};
