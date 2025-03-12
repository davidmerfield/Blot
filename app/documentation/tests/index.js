describe("Blot's site'", function () {
    const site = require("site");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));

    global.test.blog();
  
    global.test.server(site);

    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
      console.log("Building views and templates");
      await build({watch: false, skipZip: true});
      await templates({watch: false});
    }, 60000);
    
    it("has no broken links", async function () {
      await global.test.brokenLinks(this.origin);
    }, 60000);

  });
  