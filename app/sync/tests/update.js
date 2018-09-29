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

  it("creates an entry from a new file", function(testDone) {
    var path = this.fake.path(".txt");
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function(err) {
        if (err) testDone.fail(err);

        checkEntry({ path: path }, function(err) {
          if (err) testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("deletes an entry when you remove the file", function(testDone) {
    var path = this.fake.path(".txt");
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function(err) {
        if (err) testDone.fail(err);

        checkEntry({ path: path, deleted: false }, function(err) {
          if (err) testDone.fail(err);

          fs.removeSync(folder.path + path);
          folder.update(path, function(err) {
            if (err) testDone.fail(err);
            checkEntry({ path: path, deleted: true }, function(err) {
              if (err) testDone.fail(err);

              done(null, testDone);
            });
          });
        });
      });
    });
  });
});
