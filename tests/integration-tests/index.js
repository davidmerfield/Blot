describe("integration tests", function () {
    const server = require("server");
    const puppeteer = require("puppeteer");
    const config = require("config");

    global.test.blog();
    
    it("renders the homepage", async () => {

        await server.listen(config.port);
        
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});

        const page = await browser.newPage();

        await page.goto(`http://localhost:${config.port}`);

        const title = await page.title();

        expect(title).toBe('Blot');

        // // click on the 'sign up' link

        await page.goto(`http://localhost:${config.port}/how`);

        const title2 = await page.title();

        expect(title2).toBe('Documentation - Blot');

        
        
    });
    
  });
  