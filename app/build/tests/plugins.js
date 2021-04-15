describe("build", function () {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  it("will convert wikilinks if plugin is enabled", function (done) {
    var contents = "A [[wikilink]]";
    var path = "/hello.txt";

    this.blog.plugins.wikilinks = { enabled: true, options: {} };

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      expect(entry.html).toEqual(
        '<p>A <a href="wikilink" class="wikilink">wikilink</a></p>'
      );
      done();
    });
  });

  it("will turn titles into title case if plugin is enabled", function (done) {
    var contents = "# Title goes here";
    var path = "/hello.txt";

    fs.outputFileSync(this.blogDirectory + path, contents);

    this.blog.plugins.titlecase = { enabled: true, options: {} };

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);
      expect(entry.html).toEqual(
        '<h1 id="title-goes-here">Title Goes Here</h1>'
      );
      done();
    });
  });
});
