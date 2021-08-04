describe("Templates", function () {
  var buildTemplates = require("templates");

  it(
    "build without error",
    function (done) {
      buildTemplates({ watch: false }, function (err) {
        if (err) return done.fail(err);
        done();
      });
    },
    5 * 60 * 1000
  );
});
