describe("flaky file", function () {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  it(
    "will gracefully handle a file which kills a build",
    async function (done) {
      var path = "/Hello.txt";
      var contents = "World";

      await fs.outputFile(this.blogDirectory + path, contents);

      // will trigger uncaught exception
      build(this.blog, path, { kill: true }, function (err) {
        expect(err.message).toContain("Failed to finish task");
        build(this.blog, path, { kill: false }, function (err, entry) {
          if (err) return done.fail(err);
          expect(entry.html).toEqual("<p>World</p>");
          done();
        });
      });
    },
    10 * 1000 // set timeout to 10 seconds
  );
});
