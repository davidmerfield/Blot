describe("update", function() {
  var sync = require("../index");
  var fs = require("fs-extra");
  var async = require("async");

  // Set up a test blog before each test
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });

  beforeEach(function() {
    this.checkEntry = global.test.CheckEntry(this.blog.id);
  });

  it("detects a renamed file", function(testDone) {
    var path = this.fake.path(".txt");
    var newPath = this.fake.path(".txt");
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");

      folder.update(path, function(err) {
        if (err) testDone.fail(err);

        fs.moveSync(folder.path + path, folder.path + newPath);

        async.series(
          [folder.update.bind(this, path), folder.update.bind(this, newPath)],
          function(err) {
            if (err) testDone.fail(err);

            done(null, function() {
              // in future we might need to check this after finishing sync...
              checkEntry({ path: path, deleted: true }, function(err, entry) {
                if (err) testDone.fail(err);

                checkEntry(
                  { path: newPath, created: entry.created, deleted: false },
                  function(err) {
                    if (err) testDone.fail(err);
                    testDone();
                  }
                );
              });
            });
          }
        );
      });
    });
  });
});
