Feature: Seferci Mobil Şoför Profil Test Senaryoları


  Scenario: SEF-2 Şoför profil bilgilerinin görüntülenmesi ve güncellenmesi
    When user enters "5452517509" phone number information
    When user clicks kvkk checkbox button
    When user clicks giris kodu gonder button
    When user enters "699160" otp code
    Then user successfully logs into the system
    When user clicks "Profil" text
    When user clicks "Geç" button next to "Şoför" text
    #When user clicks "Kişisel Bilgiler" text
    #When user enters "Yeni Firma" into "Firma Adı" field
    #When user enters "012345678910" into "Vergi No" field
    #When user enters "Yeni Address" into "Adres" field
    #When user clicks "Kaydet" text
    # Kaydedilen değer, pencere yeniden açıldığında da görünmeli
    #When user clicks "Kişisel Bilgiler" text
    #Then "Firma Adı" field value should be "Yeni Firma"
    #Then "Vergi No" field value should be "012345678910"
    #Then "Adres" field value should be "Yeni Address"
    # Hesabı başlangıç durumuna döndür (sonraki koşular "Test" değerini bekler)
    #When user clicks "Vazgeç" text

  @smoke
  Scenario: SEF-2 Şoför araçlarının görüntülenmesi ve yeni araç eklenmesi
    When user enters "5452517509" phone number information
    When user clicks kvkk checkbox button
    When user clicks giris kodu gonder button
    When user enters "699160" otp code
    Then user successfully logs into the system
    When user clicks "Profil" text
    When user clicks "Geç" button next to "Şoför" text
    When user clicks "Araçlarım" text
    When user clicks "Araç Ekle" text
    When user enters "34HMU322" into "Plaka *" field
    When user enters "Taylan Güleç" into "Şoför Ad-Soyad *" field
    When user enters "5452517509" into "Şoför Telefon *" field
    When user scrolls and clicks "Aracı Kaydet" text
    Then user sees "34HMU321" text