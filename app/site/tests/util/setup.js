module.exports = function({login = false} = {}){
    const LONG_TIMEOUT = 60000;
    const site = require("site");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));
    const puppeteer = require('puppeteer');

    global.test.server(site);


    // for each spec, create a new page
    // and close it after the spec is done
    beforeEach(async function () {
        this.page = await this.browser.newPage();

        // disable cache for each test
        await this.page.setCacheEnabled(false);
    });

    afterEach(async function () {
        // clear cookies after each test
        // otherwise the next test will have the same cookies
        // and we'll be logged in as the previous user
        const cookies = await this.page.cookies();

        for (let cookie of cookies) {
            await this.page.deleteCookie(cookie);
        }

        await this.page.close();
    });


    if (login) {
        global.test.blog();

        beforeEach(async function(){
            const email = this.user.email;
            const password = this.user.fakePassword;
            
            const page = this.page;
            
            await page.goto(this.origin + '/sites/log-in?redirected=true');
    
            await page.type('input[name=email]', email);
            await page.type('input[name=password]', password);
    
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'load' }),
                page.click('[type=submit]')
            ]);
        })
    }


    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
        await build({watch: false});
        await templates({watch: false});
        this.browser = await puppeteer.launch({
                  headless: true,
                  args: ['--no-sandbox']
                });
    }, LONG_TIMEOUT);

    // increase the timeout for all tests
    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = LONG_TIMEOUT;
    });

    // reset the timeout after each test
    afterEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    });

    // close the browser after all tests are done
    afterAll(async () => {
        await this.browser.close();
    });
}