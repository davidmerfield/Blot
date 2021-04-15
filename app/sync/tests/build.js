describe("build", function () {
  const sync = require("../index");
  const fs = require("fs-extra");

  // Set up a test blog before each test
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function () {
    this.fake = global.test.fake;
  });

  beforeEach(function () {
    this.checkEntry = global.test.CheckEntry(this.blog.id);
  });

  it("rebuilds dependent entries", async function (done) {
    var Entry = require("models/entry");
    var imagePath = "/image.png";
    var imageContent = await this.fake.image();
    var path = "/post.txt";
    var content = "![](/image.png)";

    sync(this.blog.id, (err, folder, syncDone) => {
      if (err) return done.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, (err) => {
        if (err) return done.fail(err);

        fs.outputFileSync(folder.path + imagePath, imageContent);
        folder.update(imagePath, (err) => {
          if (err) return done.fail(err);

          Entry.get(this.blog.id, path, (entry) => {
            expect(entry.html).toContain("/cdn/" + this.blog.id);
            syncDone(null, done);
          });
        });
      });
    });
  });

  it("hides date with timestamp from title if its in the file name", function (testDone) {
    const path = "/2018-10-02-02-35 Hello.png";
    const content = this.fake.file();
    const checkEntry = this.checkEntry;

    sync(this.blog.id, function (err, folder, done) {
      if (err) return testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function (err) {
        if (err) return testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function (err) {
          if (err) return testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("hides date from title if its in the file name", function (testDone) {
    const path = "/2018/06-04 Hello.jpg";
    const content = this.fake.file();
    const checkEntry = this.checkEntry;

    sync(this.blog.id, function (err, folder, done) {
      if (err) return testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function (err) {
        if (err) return testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function (err) {
          if (err) return testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("preserves case in title generated from file name passed as option", function (testDone) {
    const path = "/[tag] hello.jpg";
    const content = this.fake.file();
    const checkEntry = this.checkEntry;

    sync(this.blog.id, function (err, folder, done) {
      if (err) return testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, { name: "[Tag] Hello.jpg" }, function (err) {
        if (err) return testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function (err) {
          if (err) return testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("hides tags from title if its in the file name", function (testDone) {
    const path = "/[Tag] Hello.jpg";
    const content = this.fake.file();
    const checkEntry = this.checkEntry;

    sync(this.blog.id, function (err, folder, done) {
      if (err) return testDone.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      folder.update(path, function (err) {
        if (err) return testDone.fail(err);

        checkEntry({ path: path, title: "Hello" }, function (err) {
          if (err) return testDone.fail(err);

          done(null, testDone);
        });
      });
    });
  });

  it("turns wikilinks into links", function (done) {
    const path = "/hello.md";
    const content = "[[wikilink]]";

    const linkPath = "/wikilink.md";
    const linkContent = "Link: foo\n\nWikilink";

    // We know that Blot has worked out which file to link to
    // because the href is set to foo!
    const html = '<p><a href="/foo" class="wikilink">wikilink</a></p>';

    sync(this.blog.id, (err, folder, syncDone) => {
      if (err) return done.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      fs.outputFileSync(folder.path + linkPath, linkContent, "utf-8");

      folder.update(linkPath, (err) => {
        if (err) return done.fail(err);
        folder.update(path, (err) => {
          if (err) return done.fail(err);
          this.checkEntry(
            {
              path,
              html,
            },
            function (err) {
              if (err) return done.fail(err);
              syncDone(null, done);
            }
          );
        });
      });
    });
  });

  // we switch the order when writing files to test
  // the scenario in which the linked file is added
  // after the file that does the linking
  it("turns wikilinks into links using dependencies", function (done) {
    const path = "/contains-wikilink.md";
    const content = "[[target-of-link]]";

    const linkPath = "/target-of-link.md";
    const linkContent = "Link: foo\n\nWikilink";

    // We know that Blot has worked out which file to link to
    // because the href is set to foo!
    const html = '<p><a href="/foo" class="wikilink">target-of-link</a></p>';

    sync(this.blog.id, (err, folder, syncDone) => {
      if (err) return done.fail(err);

      fs.outputFileSync(folder.path + path, content, "utf-8");
      fs.outputFileSync(folder.path + linkPath, linkContent, "utf-8");

      folder.update(path, (err) => {
        if (err) return done.fail(err);
        folder.update(linkPath, (err) => {
          if (err) return done.fail(err);
          this.checkEntry(
            {
              path,
              html,
              dependencies: [
                "/target-of-link.md"
              ],
            },
            function (err) {
              if (err) return done.fail(err);
              syncDone(null, done);
            }
          );
        });
      });
    });
  });
});
