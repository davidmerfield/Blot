describe("dropbox client", function() {
  // Create test user and tmp directory
  require("./util/setup")();

  var fs = require("fs-extra");
  var write = require("../write");
  var remove = require("../remove");

  it("removes a file", function(done) {
    var blogDirectory = this.blogDirectory;
    var path = this.fake.path(".txt");
    var contents = this.fake.file();
    var folder = this.folder;
    var client = this.client;
    var blog = this.blog;

    write(blog.id, path, contents, function(err) {
      if (err) return done.fail(err);

      remove(blog.id, path, function(err) {
        if (err) return done.fail(err);

        client
          .filesGetMetadata({ path: folder + path, include_deleted: true })
          .then(function(res) {
            // Verify file no longer exists on Dropbox
            expect(res[".tag"]).toEqual("deleted");
            // Verify the file no longer exists in blog folder
            expect(fs.existsSync(blogDirectory + path)).toEqual(false);
            done();
          })
          .catch(function(err) {
            done.fail(err);
          });
      });
    });
  }, 10*1000); // 10s
});
