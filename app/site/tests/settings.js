describe("Blot dashboard settings", function () {
    require('./util/setup')();
    
    global.test.blog();

    it("lets you update the title of a site", async function () {
        const email = this.user.email;
        const password = this.user.fakePassword;
        
        const page = this.page;

         // get any console errors
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
        // Listen for failed requests
        page.on('requestfailed', request => {
            console.log(`Failed to load: ${request.url()} - ${request.failure().errorText}`);
        });
        
        await page.goto(this.origin + '/sites/log-in?redirected=true');

        console.log('entering email');
        await page.type('input[name=email]', email);
        await page.type('input[name=password]', password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            page.click('[type=submit]')
        ]);

        // click on the first link to a site e.g. /sites/username
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            page.click('a[href^="/sites/"]')
        ]);

        console.log('clicking on settings:', 'a[href="/sites/' + this.blog.handle + '/title"]');

        // click on the title setings link
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            page.click('a[href="/sites/' + this.blog.handle + '/title"]')
        ]);

        // enter a new title, selecting all the text first
        // before typing the new title
        const input = await page.$('input[name=title]');
        await input.click({ clickCount: 3 })
        await input.type('New title');
        
        console.log('saving new title');

        // submit the form
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            page.click('[type=submit]')
        ]);

        console.log('going back to the dashboard');

        // go back to the dashboard
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'load' }),
            page.click('a[href="/sites/' + this.blog.handle + '"]')
        ]);

        // the <title> of the page should be "New title - Blot"
        expect(await page.title()).toEqual('New title - Blot');
        
    });
  });
  