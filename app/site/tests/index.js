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

    it("has no broken links for logged-in users", async function () {
      const email = this.user.email;
      const password = this.user.fakePassword;
      
      const params = new URLSearchParams();

      params.append('email', email);
      params.append('password', password);

      const res = await fetch(this.origin + "/sites/log-in", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        redirect: 'manual'
      });

      const location = res.headers.get("location");
      const cookies = res.headers.raw()['set-cookie'];

      // the response status should be 302
      // and redirect to the dashboard
      expect(res.status).toEqual(302);
      expect(cookies.join(';')).toMatch(/connect.sid/);
      expect(location).toEqual(this.origin + "/sites");

      // Use the cookie to access the dashboard
      const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    
      await checkLinks(this.origin, {headers: {
        'Cookie': cookieHeader,
      }});

    }, 60000);

    it("serves the log-in page", async function () {
        const res = await fetch(this.origin + "/sites/log-in");
        const text = await res.text();
        expect(res.status).toEqual(200);
    });
    
  });
  