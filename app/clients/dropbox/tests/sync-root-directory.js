describe("dropbox client", function() {
  // Create test user and tmp directory
  require("./setup")({ root: true });

  var fs = require("fs-extra");
  var write = require("../write");
  var sync = require("../sync");

  it(
    "syncs changes to the root folder of a Dropbox",
    function(done) {
      var blogDirectory = this.blogDirectory;
      var blog = this.blog;

      var path = this.fake.path(".txt");
      var contents = this.fake.file();

      write(blog.id, path, contents, function(err) {
        if (err) return done.fail(err);

        sync(blog, function(err) {
          if (err) return done.fail(err);

          expect(
            fs.readFileSync(blogDirectory + path).toString("utf-8")
          ).toEqual(contents);

          done();
        });
      });
    });
});
