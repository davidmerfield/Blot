describe("Blot's site'", function () {
    const site = require("site");
    const fetch = require("node-fetch");

    global.test.blog();
  
    global.test.server(site);

    it("serves the log-in page", async function () {
        const res = await fetch(this.origin + "/sites/log-in");
        const text = await res.text();
        expect(res.status).toEqual(200);
    });
    
  });
  