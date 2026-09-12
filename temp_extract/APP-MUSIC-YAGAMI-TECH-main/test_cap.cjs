const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Inject mock Capacitor missing plugin
  await page.evaluateOnNewDocument(() => {
    window.Capacitor = {
      isNativePlatform: () => true,
      registerPlugin: (name) => {
        return new Proxy({}, {
          get: (target, prop) => {
            return () => Promise.reject(new Error(`Plugin ${name} does not have method ${prop}`));
          }
        });
      }
    };
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await browser.close();
})();
