export class BasePage {
  protected driver: any;

  constructor(driver: any) {
    this.driver = driver;
  }

  async get(locator: string) {
    const el = await this.driver.$(locator);
    await el.waitForExist({
      timeout: 30000,
      timeoutMsg: `Element not found: ${locator}`
    });
    return el;
  }

  async click(locator: string) {
    const el = await this.get(locator);
    await el.click();
  }

  async fill(locator: string, text: string) {
    const el = await this.get(locator);
    await el.clearValue();
    await el.setValue(text);
  }

  async wait(seconds: number) {
    this.log(`Waiting for ${seconds} seconds`);
    await this.driver.pause(seconds * 1000);
  }

  log(message: string) {
    console.log(`ℹ️ ${message}`);
  }
  async swipeUp(times = 1) {
    const { height, width } = await this.driver.getWindowSize();

    const startX = Math.floor(width / 2);
    const startY = Math.floor(height * 0.75);
    const endY = Math.floor(height * 0.25);

    for (let i = 0; i < times; i++) {
      await this.driver.performActions([
        {
          type: 'pointer',
          id: 'finger1',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, x: startX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 200 },
            { type: 'pointerMove', duration: 700, x: startX, y: endY },
            { type: 'pointerUp', button: 0 }
          ]
        }
      ]);

      await this.driver.releaseActions();
      await this.driver.pause(1000);
    }
  }

  /**
   * Metne göre element bulup tıklar. Metin hem `text` hem `content-desc`
   * özelliğinde aranır (React Native butonlarında yazı çoğunlukla content-desc'tedir).
   *
   *   await this.clickByText('Giriş Kodu Gönder');                 // tam eşleşme
   *   await this.clickByText('Merhaba', { exact: false });         // metni içeren
   *   await this.clickByText('Profil', { maxSwipes: 3 });          // bulamazsa 3 kez aşağı kaydırır
   */
  async clickByText(
    text: string,
    options: { exact?: boolean; timeout?: number; maxSwipes?: number } = {}
  ) {
    const { exact = true, timeout = 10000, maxSwipes = 0 } = options;
    const locator = this.textLocator(text, exact);

    for (let attempt = 0; ; attempt++) {
      const el = await this.findDisplayed(locator, attempt === 0 ? timeout : 3000);

      if (el) {
        await el.click();
        this.log(`Clicked text: "${text}"`);
        return;
      }

      if (attempt >= maxSwipes) {
        throw new Error(
          `❌ "${text}" metni ${exact ? 'ile birebir eşleşen' : 'geçen'} element bulunamadı` +
          (maxSwipes > 0 ? ` (${maxSwipes} kez kaydırıldı)` : '')
        );
      }

      this.log(`"${text}" görünmüyor, aşağı kaydırılıyor (${attempt + 1}/${maxSwipes})`);
      await this.swipeUp(1);
    }
  }

  /**
   * Açık klavyeyi kapatır; klavye kapalıysa hiçbir şey yapmaz.
   * Klavyenin "Done" (IME) aksiyonu kullanılır. driver.hideKeyboard() kullanılmaz:
   * Android'de geri tuşuna bastığı için bazı formlar (ör. Araç Ekle) kapanıp önceki ekrana döner.
   * Kapatıldıysa true döner.
   */
  async closeKeyboard(): Promise<boolean> {
    if (!(await this.driver.isKeyboardShown().catch(() => false))) return false;

    this.log('⌨️ Klavye açık, "Done" ile kapatılıyor');
    await this.driver
      .execute('mobile: performEditorAction', { action: 'done' })
      .catch(() => undefined);

    const closed = await this.driver
      .waitUntil(async () => !(await this.driver.isKeyboardShown().catch(() => false)), {
        timeout: 2000,
        interval: 300,
      })
      .then(() => true)
      .catch(() => false);

    if (!closed) this.log('⚠️ Klavye "Done" ile kapanmadı');
    return closed;
  }

  /**
   * Locator'a uyan elementin görünmesini bekler; görünmezse null döner.
   * Element hemen görünmüyorsa ve klavye açıksa önce klavye kapatılır
   * (klavyenin altında kalan butonlar, ör. "Aracı Kaydet", görünür olsun diye).
   */
  private async findDisplayed(locator: string, timeout: number) {
    const el = await this.driver.$(locator);
    if (await el.isDisplayed().catch(() => false)) return el;

    await this.closeKeyboard();

    return await el
      .waitForDisplayed({ timeout })
      .then(() => el)
      .catch(() => null);
  }

  /** Metni içeren elemente tıklar: clickByText(text, { exact: false }) kısayolu. */
  async clickByPartialText(text: string, options: { timeout?: number; maxSwipes?: number } = {}) {
    await this.clickByText(text, { ...options, exact: false });
  }

  /** Metin ekranda görünüyor mu (beklemeden kontrol eder, hata fırlatmaz). */
  async isTextVisible(text: string, exact = true): Promise<boolean> {
    const el = await this.driver.$(this.textLocator(text, exact));
    return await el.isDisplayed().catch(() => false);
  }

  /**
   * Metnin ekranda göründüğünü doğrular; görünmezse step fail olur.
   *
   *   await this.verifyTextVisible('Merhaba', { exact: false });
   *   await this.verifyTextVisible('Çıkış Yap', { maxSwipes: 3 });   // gerekirse aşağı kaydırır
   */
  async verifyTextVisible(
    text: string,
    options: { exact?: boolean; timeout?: number; maxSwipes?: number } = {}
  ) {
    const { exact = true, timeout = 10000, maxSwipes = 0 } = options;
    const locator = this.textLocator(text, exact);

    for (let attempt = 0; ; attempt++) {
      const el = await this.findDisplayed(locator, attempt === 0 ? timeout : 3000);

      if (el) {
        this.log(`✅ Text visible: "${text}"`);
        return;
      }

      if (attempt >= maxSwipes) {
        throw new Error(
          `❌ "${text}" metni ${exact ? 'ile birebir eşleşen' : 'geçen'} element ekranda görünmedi` +
          (maxSwipes > 0 ? ` (${maxSwipes} kez kaydırıldı)` : ` (${timeout / 1000} sn beklendi)`)
        );
      }

      this.log(`"${text}" görünmüyor, aşağı kaydırılıyor (${attempt + 1}/${maxSwipes})`);
      await this.swipeUp(1);
    }
  }

  /** Metnin ekranda görünmediğini doğrular (ör. popup kapandı mı); görünürse step fail olur. */
  async verifyTextNotVisible(text: string, options: { exact?: boolean; timeout?: number } = {}) {
    const { exact = true, timeout = 5000 } = options;
    const el = await this.driver.$(this.textLocator(text, exact));
    await el.waitForDisplayed({
      timeout,
      reverse: true,
      timeoutMsg: `❌ "${text}" metni ${timeout / 1000} sn sonra hâlâ ekranda görünüyor`,
    });
    this.log(`✅ Text not visible: "${text}"`);
  }

  /**
   * Etiketi verilen alanın değerini döndürür. İki yerleşim desteklenir:
   *   - Üstte etiket, altında textbox (Firma Adı, Vergi No, Adres)
   *   - Solda etiket, sağında metin (Hesap Durumu → Onaylı, Üyelik Tarihi, Puan)
   *
   *   const value = await this.getFieldValue('Firma Adı');
   *
   * Değer, ekrandaki konumuna göre seçilir; ekranın XML yapısına (iç içe/yan yana) bağlı değildir.
   */
  async getFieldValue(label: string, options: { timeout?: number; maxSwipes?: number } = {}): Promise<string> {
    const labelEl = await this.waitForFieldLabel(label, options);
    const valueEl = (await this.findInputBelow(labelEl)) || (await this.findTextRightOf(labelEl));
    if (!valueEl) {
      throw new Error(
        `❌ "${label}" etiketi bulundu ama altında textbox veya sağında değer bulunamadı`
      );
    }
    return ((await valueEl.getText()) || '').trim();
  }

  /**
   * Etiketi verilen textbox'a (üstte etiket, altında textbox) metin yazar.
   * Alandaki mevcut değer önce silinir; yazılan değer okunup kontrol edilir
   * (karakter sınırı vb. yüzünden farklı kaydedildiyse step fail olur).
   *
   *   await this.fillField('Firma Adı', 'Yeni Firma');
   *   await this.fillField('Adres', 'Test Mah.', { maxSwipes: 3 });   // gerekirse aşağı kaydırır
   */
  async fillField(label: string, text: string, options: { timeout?: number; maxSwipes?: number } = {}) {
    const labelEl = await this.waitForFieldLabel(label, options);
    const input = await this.findInputBelow(labelEl);
    if (!input) {
      throw new Error(`❌ "${label}" etiketi bulundu ama altında textbox bulunamadı`);
    }

    await input.click();
    await input.clearValue();
    await input.setValue(text);

    // Not: Klavye burada kapatılmaz. Android'de hideKeyboard() geri tuşuna basar;
    // bazı formlar (ör. Araç Ekle) geri tuşunda kendini kapatıp önceki ekrana döner.

    // Uygulamanın eklediği biçim boşlukları (ör. plaka "34HMU321" → "34 HMU 321") yok sayılır;
    // biçimin kendisi gerekirse "field value should be" adımıyla doğrulanır.
    const actual = ((await input.getText()) || '').trim();
    const noSpaces = (s: string) => s.replace(/\s+/g, '');
    if (noSpaces(actual) !== noSpaces(text)) {
      throw new Error(
        `❌ "${label}" alanına yazılan değer hatalı. Beklenen: "${text}", Gerçek: "${actual}"`
      );
    }
    this.log(`✏️ "${label}" alanına yazıldı: "${text}"`);
  }

  /**
   * Etiketi verilen alanın değerini doğrular; farklıysa step fail olur.
   *   await this.verifyFieldValue('Firma Adı', 'Test');
   */
  async verifyFieldValue(
    label: string,
    expected: string,
    options: { timeout?: number; maxSwipes?: number } = {}
  ) {
    const actual = await this.getFieldValue(label, options);
    if (actual !== expected.trim()) {
      throw new Error(
        `❌ "${label}" alanının değeri hatalı. Beklenen: "${expected}", Gerçek: "${actual}"`
      );
    }
    this.log(`✅ "${label}" = "${actual}"`);
  }

  /**
   * Verilen metnin bulunduğu satırda, metnin sağındaki butona tıklar.
   * Aynı adlı birden fazla buton olduğunda (ör. her rol satırında bir "Geç") doğru satırınkini seçer.
   *
   *   await this.clickNextTo('Geç', 'Şoför');
   *   await this.clickNextTo('Geç', 'Nakliyeci', { maxSwipes: 3 });   // gerekirse aşağı kaydırır
   */
  async clickNextTo(target: string, label: string, options: { timeout?: number; maxSwipes?: number } = {}) {
    const labelEl = await this.waitForFieldLabel(label, options);
    const button = await this.findRightOf(labelEl, this.textLocator(target));
    if (!button) {
      throw new Error(`❌ "${label}" satırında "${target}" bulunamadı`);
    }
    await button.click();
    this.log(`Clicked "${target}" next to "${label}"`);
  }

  /** Alan etiketinin görünmesini bekler; bulamazsa maxSwipes kez aşağı kaydırarak arar. */
  private async waitForFieldLabel(label: string, options: { timeout?: number; maxSwipes?: number } = {}) {
    const { timeout = 10000, maxSwipes = 0 } = options;
    const labelLocator = this.fieldLabelLocator(label);

    for (let attempt = 0; ; attempt++) {
      const labelEl = await this.findDisplayed(labelLocator, attempt === 0 ? timeout : 3000);

      if (labelEl) return labelEl;

      if (attempt >= maxSwipes) {
        throw new Error(
          `❌ "${label}" etiketi ekranda bulunamadı` +
          (maxSwipes > 0 ? ` (${maxSwipes} kez kaydırıldı)` : ` (${timeout / 1000} sn beklendi)`)
        );
      }

      this.log(`"${label}" alanı görünmüyor, aşağı kaydırılıyor (${attempt + 1}/${maxSwipes})`);
      await this.swipeUp(1);
    }
  }

  /** Alan etiketinin (TextView) XPath'i. */
  protected fieldLabelLocator(label: string): string {
    return `//android.widget.TextView[@text=${this.xpathLiteral(label)}]`;
  }

  /**
   * Etiketin hemen altındaki görünür textbox'u (EditText) konumuna göre bulur.
   * Textbox etikete yakın olmalıdır (etiket yüksekliğinin 3 katı); böylece yanında
   * değer yazan bir etiket için ekranın çok aşağısındaki alakasız bir textbox seçilmez.
   */
  private async findInputBelow(labelEl: any) {
    const labelRect = await this.rect(labelEl);
    const labelBottom = labelRect.y + labelRect.height;
    const maxGap = labelRect.height * 3;
    const inputs = await this.driver.$$('//android.widget.EditText');

    let best: any = null;
    let bestY = Number.MAX_SAFE_INTEGER;

    for (const input of inputs) {
      if (!(await input.isDisplayed().catch(() => false))) continue;
      const { y } = await this.rect(input);
      if (y >= labelBottom - 1 && y - labelBottom <= maxGap && y < bestY) {
        best = input;
        bestY = y;
      }
    }
    return best;
  }

  /**
   * Etiketle aynı satırda, etiketin sağındaki en yakın metni (TextView) bulur.
   * Ör. "Hesap Durumu" etiketinin yanındaki "Onaylı".
   */
  private async findTextRightOf(labelEl: any) {
    return this.findRightOf(labelEl, '//android.widget.TextView');
  }

  /**
   * Locator'a uyan elementlerden, etiketle aynı satırda ve etiketin sağında olan
   * en yakın elementi bulur. Seçim ekrandaki konuma göre yapılır.
   */
  private async findRightOf(labelEl: any, locator: string) {
    const labelRect = await this.rect(labelEl);
    const labelRight = labelRect.x + labelRect.width;
    const labelTop = labelRect.y;
    const labelBottom = labelRect.y + labelRect.height;
    const candidates = await this.driver.$$(locator);

    let best: any = null;
    let bestX = Number.MAX_SAFE_INTEGER;

    for (const el of candidates) {
      const r = await this.rect(el);
      if (r.width === 0 || r.height === 0) continue;
      // Aynı satır: dikey aralıkları kesişmeli (çok satırlı değerler de yakalanır).
      const sameRow = r.y < labelBottom && r.y + r.height > labelTop;
      if (sameRow && r.x >= labelRight - 1 && r.x < bestX) {
        best = el;
        bestX = r.x;
      }
    }
    return best;
  }

  /** Elementin ekrandaki konumu ve boyutu (tek istekle). */
  private async rect(el: any): Promise<{ x: number; y: number; width: number; height: number }> {
    return this.driver.getElementRect(el.elementId);
  }

  /** text veya content-desc'e göre XPath üretir. */
  protected textLocator(text: string, exact = true): string {
    const value = this.xpathLiteral(text);
    return exact
      ? `//*[@text=${value} or @content-desc=${value}]`
      : `//*[contains(@text,${value}) or contains(@content-desc,${value})]`;
  }

  /** Metindeki tırnak işaretleri XPath'i bozmasın diye güvenli string üretir. */
  private xpathLiteral(text: string): string {
    if (!text.includes('"')) return `"${text}"`;
    if (!text.includes("'")) return `'${text}'`;
    return `concat("${text.split('"').join(`", '"', "`)}")`;
  }
}
