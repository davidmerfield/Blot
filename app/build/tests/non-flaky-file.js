describe("flaky file", function () {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  it(
    "will gracefully handle a file",
    async function (done) {
      var path = "/Hello.txt";
      var contents = "World";
      await fs.outputFile(this.blogDirectory + path, contents);

      console.log("Building file without error...");
      build(this.blog, path, { kill: false }, (err, entry) => {
        if (err) return done.fail(err);
        expect(entry.html).toEqual("<p>World</p>");
        done();
      });
    },
    10 * 1000 // set timeout to 10 seconds
  );
});
