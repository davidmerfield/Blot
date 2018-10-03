describe("dropbox client", function() {
  // Create test user and tmp directory
  require("./util/setup")();

  var fs = require('fs-extra');
  var write = require("../write");

  it("syncs changes when the blog folder is moved", function(done) {
    var blogDirectory = this.blogDirectory;
    var path = this.fake.path(".txt");
    var contents = this.fake.file();
    var folder = this.folder;
    var client = this.client;

    write(this.blog.id, path, contents, function(err) {
      if (err) return done.fail(err);

      client
        .filesDownload({ path: folder + path })
        .then(function(res) {
          // Check file exists in blog directory in Dropbox
          expect(res.fileBinary.toString("utf-8")).toEqual(contents);

          // check file exists in blog directory on Blot
          expect(fs.readFileSync(blogDirectory + path).toString('utf-8')).toEqual(contents);

          done();
        })
        .catch(function(err) {
          done.fail(err);
        });
    });
  });
});
