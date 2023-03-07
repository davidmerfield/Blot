describe("wikilinks plugin", function () {
  const build = require("build");
  const fs = require("fs-extra");

  // Set up a test blog before each test
  global.test.blog();

  it("will convert wikilinks if plugin is enabled", function (done) {
    const contents = "A [[wikilink]]";
    const path = "/hello.txt";
    const html = '<p>A <a href="wikilink" class="wikilink">wikilink</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will convert wikilinks whose links are affected by typeset", function (done) {
    const contents = "A [[wikilink 3D with acronym]]";
    const path = "/hello.txt";
    const html =
      '<p>A <a href="wikilink 3D with acronym" class="wikilink">wikilink <span class="small-caps">3D</span> with acronym</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  // This is neccessary because other plugins can mess with the
  // link contents (e.g. the typeset plugin) so we remove this later
  it("will preserve custom link text in data attribute", function (done) {
    const contents = "[[target|custom]]";
    const path = "/hello.txt";
    const html =
      '<p><a href="target" class="wikilink" data-text="custom">custom</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will convert multiple wikilinks on one line", function (done) {
    const contents = "A [[wikilink]] and [[another]]";
    const path = "/hello.txt";
    const html =
      '<p>A <a href="wikilink" class="wikilink">wikilink</a> and <a href="another" class="wikilink">another</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will ignore wikilinks spanning multiple lines", function (done) {
    const contents = "[[wiki\n\nhey]]";
    const path = "/hello.txt";
    const html = "<p>[[wiki</p>\n<p>hey]]</p>";

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will convert wikilinks inside other nodes", function (done) {
    const contents = "- A **[[wikilink]]** in a list";
    const path = "/hello.txt";
    const html =
      '<ul>\n<li>A <strong><a href="wikilink" class="wikilink">wikilink</a></strong> in a list</li>\n</ul>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will convert wikilinks next to ignored nodes", function (done) {
    const contents =
      "<script>console.log('hey');</script>\n\nA **[[wikilink elsewhere]]** ";
    const path = "/hello.txt";
    const html = `<script>console.log('hey');</script>\n<p>A <strong><a href="wikilink elsewhere" class="wikilink">wikilink elsewhere</a></strong></p>`;

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will convert wikilinks whose path contains square brackets", function (done) {
    const contents = "[[../[snips]/wikilink]]";
    const path = "/hello.txt";
    const html =
      '<p><a href="../[snips]/wikilink" class="wikilink">../[snips]/wikilink</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
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
    const html =
      '<p><a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a> <a href="/target" class="wikilink">Target</a></p>';

    const files = [
      { path: linkPath, content: linkContent },
      { path, content },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
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

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function () {
    this.checkEntry = global.test.CheckEntry(this.blog.id);
    this.syncAndCheck = global.test.SyncAndCheck(this.blog.id);
    this.fake = global.test.fake;
    this.buildAndCheck = ({ path, contents }, expectedEntry, cb) => {
      fs.outputFileSync(this.blogDirectory + path, contents);
      build(this.blog, path, {}, function (err, entry) {
        for (let key in expectedEntry)
          expect(expectedEntry[key]).toEqual(entry[key]);
        cb();
      });
    };
  });
});
