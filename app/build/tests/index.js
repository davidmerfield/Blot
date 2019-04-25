describe("build", function() {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  it("resolves relative paths inside files", function(done) {
    var path = "/blog/foo.txt";
    var contents = "![Image](_foo.jpg)";
    var absolutePathToImage = "/blog/_foo.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      expect(entry.html).toContain(absolutePathToImage);
      done();
    });
  });
});
