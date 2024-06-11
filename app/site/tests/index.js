describe("Blot's site'", function () {
    const site = require("site");
    const fetch = require("node-fetch");
    const build = require("documentation/build");
    const templates = require('util').promisify(require("templates"));
    const checkLinks = require('./util/broken');

    global.test.blog();
  
    global.test.server(site);

    // we must build the views for the documentation
    // and the dashboard before we launch the server
    // we also build the templates into the cache
    beforeAll(async () => {
      console.time("build");
      await build({watch: false});
      console.timeEnd("build");
      console.time("templates");
      await templates({watch: false});
      console.timeEnd("templates");
    });

    it("has no broken links", async function () {
      await checkLinks(this.origin);
    }, 60000);

    it("serves the log-in page", async function () {
        const res = await fetch(this.origin + "/sites/log-in");
        const text = await res.text();
        expect(res.status).toEqual(200);
    });
    
    it("lets user log in", async function () {
      const email = this.user.email;
      const password = this.user.fakePassword;

      const res = await fetch(this.origin + "/sites/log-in", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" }
      });

      const cookie = res.headers.get("set-cookie");

      expect(cookie).toBeTruthy();

      // load the dashboard using the cookie

      const res2 = await fetch(this.origin + "/sites", {
        headers: { cookie }
      });

      const text = await res2.text();

      expect(res2.status).toEqual(200);

    });

  });
  