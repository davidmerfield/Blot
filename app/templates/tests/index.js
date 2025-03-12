describe("Templates", function () {
  const buildTemplates = require("templates");
  const config = require("config");

  // Set timeout to 5 minutes
  global.test.timeout(5 * 60 * 1000);

  global.test.site();

  it(
    "build without error",
    function (done) {
      buildTemplates({ watch: false }, function (err) {
        if (err) return done.fail(err);
        done();
      });
    },
  );

  it("has no broken links for the blog template", async function () {
    await this.checkBrokenLinks("https://preview-of-blog-on-" + this.blog.handle + "." + config.host);
  });
});
