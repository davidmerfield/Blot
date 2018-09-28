describe("update", function() {
  var sync = require("../index");
  var fs = require("fs-extra");

  // Set up a test blog before each test
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });

  beforeEach(function() {
    this.checkEntry = global.test.CheckEntry(this.blog.id);
  });

  it("creates an entry from a new file", function(done) {
    var path = this.fake.path(".txt");
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, blogDirectory, update, release) {
      if (err) done.fail(err);

      fs.outputFileSync(blogDirectory + path, content, "utf-8");
      update(path, function(err) {
        if (err) done.fail(err);

        checkEntry({ path: path }, function(err) {
          if (err) done.fail(err);

          release(done);
        });
      });
    });
  });

  it("deletes an entry when you remove the file", function(done) {
    var path = this.fake.path(".txt");
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, blogDirectory, update, release) {
      if (err) done.fail(err);

      fs.outputFileSync(blogDirectory + path, content, "utf-8");
      update(path, function(err) {
        if (err) done.fail(err);

        checkEntry({ path: path, deleted: false }, function(err) {
          if (err) done.fail(err);

          fs.removeSync(blogDirectory + path);
          update(path, function(err) {
            if (err) done.fail(err);
            checkEntry({ path: path, deleted: true }, function(err) {
              if (err) done.fail(err);

              release(done);
            });
          });
        });
      });
    });
  });
});
