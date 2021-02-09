describe("build", function() {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  it("will turn titles into title case if plugin is enabled", function(done) {
    var contents = "# Title goes here";
    var path = "/hello.txt";

    fs.outputFileSync(this.blogDirectory + path, contents);

    this.blog.plugins.titlecase = {enabled: true, options: {}};

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);
      expect(entry.html).toEqual('<h1 id="title-goes-here">Title Goes Here</h1>')
      done();
    });
  });

});
