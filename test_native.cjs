const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Inject mock Capacitor
  await page.evaluateOnNewDocument(() => {
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        LiquidTabBar: {
          initializeTabBar: () => Promise.resolve(),
          updateTab: () => Promise.resolve(),
          addListener: () => Promise.resolve({ remove: () => {} })
        }
      }
    };
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await browser.close();
})();
