describe("Templates", function () {
  const config = require("config");

  // Set timeout to 5 minutes
  global.test.timeout(5 * 60 * 1000);

  global.test.site();

  const templates = require("fs")
    .readdirSync(__dirname + "/../latest")
    .concat(require("fs").readdirSync(__dirname + "/../past"))
    .filter((i) => i.indexOf(".") === -1);

  templates.forEach((template) => {
    it(
      "has no broken links for the " + template + " template",
      async function () {
        await this.checkBrokenLinks(
          "https://preview-of-" +
            template +
            "-on-" +
            this.blog.handle +
            "." +
            config.host 
        );
      }
    );
  });
});
