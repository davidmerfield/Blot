describe("Blot broken links", function () {
  var buildTemplates = require("templates");
  var dashboard = require("dashboard");
  var broken = require("../util/broken");

  it(
    "templates build without error",
    function (done) {
      buildTemplates({ watch: false }, function (err) {
        if (err) return done.fail(err);
        done();
      });
    },
    5 * 60 * 1000
  );
});
