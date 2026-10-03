# apps/

Test edilecek Seferci APK'sını bu klasöre koyun, örneğin:

```
apps/seferci.apk
```

- APK dosyaları **git'e eklenmez** (`.gitignore`: `apps/*.apk`).
- Güncel APK'yı ekibin ortak dosya alanından indirin ve hangi sürümü test ettiğinizi not edin
  (ör. `seferci-2.4.1.apk`).
- `.env` içindeki `APP_PATH` bu dosyayı göstermelidir: `APP_PATH=./apps/seferci.apk`
- BrowserStack için: `npm run upload:bs`
