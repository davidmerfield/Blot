
describe("Blot sign up", function () {

    const puppeteer = require('puppeteer');
    const site = require("site");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));
    const LONG_TIMEOUT = 60000;

    global.test.server(site);

    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
        await build({watch: false});
        await templates({watch: false});
    }, LONG_TIMEOUT);

    it("works", async function () {

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
         });

         // navigate to this.origin/sites/sign-up
        const page = await browser.newPage();

        // get any console errors
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        // Listen for failed requests
  page.on('requestfailed', request => {
    console.log(`Failed to load: ${request.url()} - ${request.failure().errorText}`);
  });

  const card = {
    number: '4242424242424242',
    month: '12',
    year: '28',
    cvc: '123',
    zip: '12345'
    };

        await page.goto(this.origin + '/sites/sign-up');

        console.log('entering email');
        await page.type('input[name=email]', 'test@gmail.com');
        await page.keyboard.press("Tab");
        console.log('entering card');
        await page.keyboard.type(card.number, { delay: 50 })
        console.log('entering month');
        await page.keyboard.type(card.month, { delay: 50 })
        console.log('entering year');
        await page.keyboard.type(card.year, { delay: 50 })
        console.log('entering cvc');
        await page.keyboard.type(card.cvc, { delay: 50 })
        console.log('entering zip');
        await page.keyboard.type(card.zip, { delay: 50 })

        console.log('submitting payment form');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.click('[type=submit]'),
        ]);
        
        console.log('checking page url');
        expect(page.url()).toEqual(this.origin + '/sites/sign-up/create-account');

        // enter a password
        console.log('entering password');
        await page.type('input[name=password]', 'password');

        // // submit the form
        console.log('submitting password form');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.click('[type=submit]'),
        ]);

        // wait for the create site page to load
        expect(page.url()).toEqual(this.origin + '/sites/account/create-site');

        // enter a title for the site
        console.log('entering site title');
        await page.type('input[name=title]', 'Test Site');

        console.log('submitting form to create site');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.click('[type=submit]'),
        ]);

        // wait for the sites page to load
        expect(page.url()).toEqual(this.origin + '/sites/testsite/client');

        // close the browser
        await browser.close();


    }, LONG_TIMEOUT);
  });
  