describe("Templates", function () {
  const config = require("config");

  // Set timeout to 5 minutes
  global.test.timeout(5 * 60 * 1000);

  global.test.site();

  it("has no broken links for the blog template", async function () {
    await this.checkBrokenLinks("https://preview-of-blog-on-" + this.blog.handle + "." + config.host);
  });
});
