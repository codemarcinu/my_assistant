import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// Konfiguracja sklepów
const STORES_CONFIG = {
  lidl: {
    name: 'Lidl',
    url: 'https://www.lidl.pl/pl/promocje',
    selectors: {
      promoItems: '.promo-item, .product-item, [data-testid*="promo"]',
      title: '.title, .product-name, h3, h4',
      discount: '.discount, .price-discount, .savings',
      validTo: '.valid-date, .expiry-date, .promo-end',
      price: '.price, .current-price',
      originalPrice: '.original-price, .old-price'
    }
  },
  biedronka: {
    name: 'Biedronka',
    url: 'https://www.biedronka.pl/pl/promocje',
    selectors: {
      promoItems: '.offer-card, .product-card, [data-testid*="offer"]',
      title: '.offer-title, .product-title, h3, h4',
      discount: '.offer-discount, .price-discount, .savings',
      validTo: '.offer-validity, .expiry-date, .promo-end',
      price: '.price, .current-price',
      originalPrice: '.original-price, .old-price'
    }
  }
};

// Funkcja scrapowania z obsługą błędów i retry
async function scrapeStore(storeKey, maxRetries = 3) {
  const store = STORES_CONFIG[storeKey];
  if (!store) {
    throw new Error(`Nieznany sklep: ${storeKey}`);
  }

  let browser;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      console.error(`[${store.name}] Próba ${attempts + 1}/${maxRetries}`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });

      const page = await browser.newPage();
      
      // Ustawienia stealth
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Dodaj losowe opóźnienie
      const delay = Math.random() * 2000 + 1000;
      await page.waitForTimeout(delay);

      console.error(`[${store.name}] Ładowanie strony: ${store.url}`);
      await page.goto(store.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Czekaj na załadowanie treści
      await page.waitForTimeout(3000);

      // Sprawdź czy strona się załadowała
      const pageTitle = await page.title();
      console.error(`[${store.name}] Tytuł strony: ${pageTitle}`);

      // Scrapuj promocje
      const promotions = await page.evaluate((selectors) => {
        const items = Array.from(document.querySelectorAll(selectors.promoItems));
        
        return items.map(item => {
          const title = item.querySelector(selectors.title)?.innerText?.trim() || '';
          const discount = item.querySelector(selectors.discount)?.innerText?.trim() || '';
          const validTo = item.querySelector(selectors.validTo)?.innerText?.trim() || '';
          const price = item.querySelector(selectors.price)?.innerText?.trim() || '';
          const originalPrice = item.querySelector(selectors.originalPrice)?.innerText?.trim() || '';
          
          // Wyciągnij procent rabatu
          let discountPercent = 0;
          if (discount) {
            const percentMatch = discount.match(/(\d+)%/);
            if (percentMatch) {
              discountPercent = parseInt(percentMatch[1]);
            }
          }
          
          return {
            title,
            discount,
            discountPercent,
            validTo,
            price,
            originalPrice,
            scrapedAt: new Date().toISOString()
          };
        }).filter(item => item.title && item.title.length > 0); // Filtruj puste elementy
      }, store.selectors);

      await browser.close();
      
      console.error(`[${store.name}] Znaleziono ${promotions.length} promocji`);
      
      return {
        store: store.name,
        storeKey,
        promotions,
        scrapedAt: new Date().toISOString(),
        success: true
      };

    } catch (error) {
      console.error(`[${store.name}] Błąd podczas scrapowania (próba ${attempts + 1}):`, error.message);
      
      if (browser) {
        await browser.close();
      }
      
      attempts++;
      
      if (attempts < maxRetries) {
        // Czekaj przed kolejną próbą
        const retryDelay = Math.random() * 5000 + 2000;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        return {
          store: store.name,
          storeKey,
          promotions: [],
          error: error.message,
          scrapedAt: new Date().toISOString(),
          success: false
        };
      }
    }
  }
}

// Funkcja główna
async function main() {
  const args = process.argv.slice(2);
  const results = [];

  try {
    // Sprawdź argumenty
    if (args.includes('--lidl')) {
      console.error('Rozpoczynam scrapowanie Lidl...');
      const lidlResult = await scrapeStore('lidl');
      results.push(lidlResult);
    }

    if (args.includes('--biedronka')) {
      console.error('Rozpoczynam scrapowanie Biedronka...');
      const biedronkaResult = await scrapeStore('biedronka');
      results.push(biedronkaResult);
    }

    if (args.includes('--all')) {
      console.error('Rozpoczynam scrapowanie wszystkich sklepów...');
      for (const storeKey of Object.keys(STORES_CONFIG)) {
        const result = await scrapeStore(storeKey);
        results.push(result);
        // Dodaj opóźnienie między sklepami
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Wyślij wyniki do stdout (JSON)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      totalStores: results.length,
      totalPromotions: results.reduce((sum, r) => sum + r.promotions.length, 0)
    }));

  } catch (error) {
    console.error('Błąd główny:', error.message);
    process.exit(1);
  }
}

// Uruchom jeśli to główny moduł
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Błąd krytyczny:', error);
    process.exit(1);
  });
}

export { scrapeStore, STORES_CONFIG }; 