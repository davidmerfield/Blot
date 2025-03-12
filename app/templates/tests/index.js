describe("Templates", function () {
  const buildTemplates = require("templates");

  // Set timeout to 5 minutes
  global.test.timeout(5 * 60 * 1000);
  
  it(
    "build without error",
    function (done) {
      buildTemplates({ watch: false }, function (err) {
        if (err) return done.fail(err);
        done();
      });
    },
  );
});
