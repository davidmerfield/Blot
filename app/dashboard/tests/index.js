describe("Blot's dashboard'", function () {

  const config = require("config");

  global.test.site({login: true});
  global.test.timeout(5 * 60 * 1000); // Set timeout to 5 minutes

  it("has no broken links for logged-in users", async function () {
    await global.test.brokenLinks(this.fetch, 'https://' + config.host);
  });
});
