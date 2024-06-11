
describe("Blot sign up", function () {

    const puppeteer = require('puppeteer');
    const site = require("site");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));

    global.test.blog();
  
    global.test.server(site);

    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
      await build({watch: false});
      await templates({watch: false});
    });

    it("works", async function (done) {

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
         });

        const page = await browser.newPage();

        done();
    });
  });
  