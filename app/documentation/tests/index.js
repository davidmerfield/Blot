describe("Blot's documentation'", function () {

  const config = require("config");

  global.test.site();
  global.test.timeout(5 * 60 * 1000); // Set timeout to 5 minutes

  it("has no broken links", async function () {
    await global.test.brokenLinks(this.fetch, 'https://' + config.host);
  });
});
