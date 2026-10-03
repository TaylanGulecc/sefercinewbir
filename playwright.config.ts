import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// .feature dosyalarından Playwright testleri üretilir (bddgen) ve bu klasöre yazılır.
const testDir = defineBddConfig({
    features: 'features/**/*.feature',
    steps: ['steps/**/*.ts', 'fixtures.ts'],
});

export default defineConfig({
    testDir,

    // Her senaryo için üst süre sınırı. Tek tek adımlar page metotlarındaki
    // waitForDisplayed süreleriyle sınırlı; bu değer tüm senaryoyu kapsar.
    timeout: 5 * 60 * 1000,

    // Aynı anda kaç senaryo koşacağı. Her worker ayrı bir Appium session açar,
    // yani ayrı bir cihaz/emülatör gerekir. Tek emülatörde 1'de bırakın.
    workers: Number(process.env.WORKERS || 1),
    fullyParallel: false,

    // CI'da kararsız (flaky) testler için 1 kez tekrar dene; local'de deneme.
    retries: process.env.CI ? 1 : 0,

    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ],

    outputDir: 'test-results',
});
