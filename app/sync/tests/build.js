describe("build", function() {
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

  it("hides date with timestamp from title if its in the file name", function(testDone) {
    var path = "/2018-10-02-02-35 Hello.png";
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function(err) {
        if (err) testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function(err) {
          if (err) testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("hides date from title if its in the file name", function(testDone) {
    var path = "/2018/06-04 Hello.jpg";
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function(err) {
        if (err) testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function(err) {
          if (err) testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("preserves case in title generated from file name passed as option", function(testDone) {
    var path = "/[tag] hello.jpg";
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, { name: "[Tag] Hello.jpg" }, function(err) {
        if (err) testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function(err) {
          if (err) testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("hides tags from title if its in the file name", function(testDone) {
    var path = "/[Tag] Hello.jpg";
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    sync(this.blog.id, function(err, folder, done) {
      if (err) testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function(err) {
        if (err) testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function(err) {
          if (err) testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });
});
