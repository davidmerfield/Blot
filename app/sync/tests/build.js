describe("build", function () {
  // Set up a test blog before each test
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function () {
    this.fake = global.test.fake;
  });

  beforeEach(function () {
    this.checkEntry = global.test.CheckEntry(this.blog.id);
    this.syncAndCheck = global.test.SyncAndCheck(this.blog.id);
  });

  it("hides date with timestamp from title if its in the file name", function (done) {
    const path = "/2018-10-02-02-35 Hello.png";
    const content = this.fake.file();

    const file = { path, content };
    const entry = { path, title: "Hello" };

    this.syncAndCheck(file, entry, done);
  });

  it("can publish an entry inside a folder with leading and trailing whitespace", function (done) {
    const path = "/ 2018 / Hello.txt";
    const content = "# Hello";

    const file = { path, content };
    const entry = { path, title: "Hello" };

    this.syncAndCheck(file, entry, done);
  });

  it("ignores files in templates folder", function (done) {
    this.syncAndCheck(
      [
        { path: "/Templates/foo.txt", content: this.fake.file() },
        { path: "/templates/bar.txt", content: this.fake.file() },
      ],
      [
        { path: "/Templates/foo.txt", ignored: true },
        { path: "/templates/bar.txt", ignored: true },
      ],
      done
    );
  });

  it("ignores files and files inside folders which start with an underscore", function (done) {
    this.syncAndCheck(
      [
        { path: "/Posts/_foo.txt", content: this.fake.file() },
        { path: "/_Pages/bar.txt", content: this.fake.file() },
        { path: "/Mean/_bar/Ba/t.txt", content: this.fake.file() },
      ],
      [
        { path: "/Posts/_foo.txt", ignored: true },
        { path: "/_Pages/bar.txt", ignored: true },
        { path: "/Mean/_bar/Ba/t.txt", ignored: true },
      ],
      done
    );
  });

  it("ignores dot files and files inside dot folders", function (done) {
    this.syncAndCheck(
      [
        { path: "/.foo.txt", content: this.fake.file() },
        { path: "/.pages/bar.txt", content: this.fake.file() },
        { path: "/mean/.bar/Ba/t.txt", content: this.fake.file() },
      ],
      [
        { path: "/.foo.txt", ignored: true },
        { path: "/.pages/bar.txt", ignored: true },
        { path: "/mean/.bar/Ba/t.txt", ignored: true },
      ],
      done
    );
  });

  it("hides date from title if its in the file name", function (done) {
    const path = "/2018/06-04 Hello.jpg";
    const content = this.fake.file();

    const file = { path, content };
    const entry = { path, title: "Hello" };

    this.syncAndCheck(file, entry, done);
  });

  it("uses link metadata", function (done) {
    const path = "/hey.txt";
    const content = "Link: example.com/\n\nHey!";

    const file = { path, content };
    const entry = { path, url: "/example.com" };

    this.syncAndCheck(file, entry, done);
  });

  it("ignores link metadata if it contains a full URL", function (done) {
    const path = "/hey.txt";
    const content = "Link: http://example.com/\n\nHey!";

    const file = { path, content };
    const entry = { path, url: "/hey" };

    this.syncAndCheck(file, entry, done);
  });

  it("hides tags from title if its in the file name", function (done) {
    const path = "/[Tag] Hello.jpg";
    const content = this.fake.file();

    const file = { path, content };
    const entry = { path, title: "Hello" };

    this.syncAndCheck(file, entry, done);
  });

  // the linked file is added after the linking file
  it("turns wikilinks into links in reverse order", function (done) {
    const path = "/hello.md";
    const content = "[[wikilink]]";

    const linkPath = "/wikilink.md";
    const linkContent = "Link: foo\n\nWikilink";

    // We know that Blot has worked out which file to link to
    // because the href is set to foo!
    const html = '<p><a href="/foo" class="wikilink">Wikilink</a></p>';

    const files = [
      { path, content },
      { path: linkPath, content: linkContent },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

      // // Absolute perfect path
      // "[[/Sub/child/Target]]",
      // // Absolute path with bad base
      // "[[/sub/Child/target]]",

  it("turns relative wikilinks into links", function (done) {
    const path = "/Sub/Source.md";
    const content = [
      // Relative perfect path
      "[[./child/Target]]",
      // Relative perfect path with extension
      "[[./child/Target.md]]",
      // Relative path with bad case
      "[[./Child/target]]",
      // Relative path with bad case and extension
      "[[./Child/target.md]]",
      // Relative path without dot-slash
      "[[child/Target]]",
      // Relative path without dot-slash and extension
      "[[child/Target.md]]",
      // Relative path without bad case and dot-slash
      "[[Child/target]]",
      // Relative path without bad case and dot-slash but extension
      "[[Child/target.md]]",
    ].join("\n");

    const linkPath = "/Sub/child/Target.md";
    const linkContent = "Link: target\n\n# Target\n\nThe linked file.";

    // We know that Blot has worked out which file to link to
    // because the href is set to target and the link text to Target!
    const html = '<p><a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a></p>';

    const files = [
      { path: linkPath, content: linkContent },
      { path, content },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

  it("preserves case in title generated from file name passed as option", function (done) {
    const path = "/[tag] hello.jpg";
    const content = this.fake.file();
    const options = { name: "[Tag] Hello.jpg" };

    const file = { path, content, options };
    const entry = { path, title: "Hello" };

    this.syncAndCheck(file, entry, done);
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
    const html = '<p><a href="/foo" class="wikilink">Wikilink</a></p>';

    const files = [
      { path, content },
      { path: linkPath, content: linkContent },
    ];

    const entry = { path, html, dependencies: ["/target-of-link.md"] };

    this.syncAndCheck(files, entry, done);
  });

  it("rebuilds dependent entries", async function (done) {
    var path = "/post.txt";
    var content = "![](/image.png)";

    var imagePath = "/image.png";
    var imageContent = await this.fake.image();

    const files = [
      { path, content },
      { path: imagePath, content: imageContent },
    ];

    const entry = {
      path,
      html: (result) => result.indexOf("/cdn/" + this.blog.id) > -1,
    };

    this.syncAndCheck(files, entry, done);
  });
});
