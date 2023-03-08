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

  it("will convert wikilinks whose text is affected by the typeset plugin", function (done) {
    const contents = "[[Wikilink CNN acronym]]";
    const path = "/hello.txt";
    const html = `<p><a href="Wikilink CNN acronym" class="wikilink">Wikilink <span class="small-caps">CNN</span> acronym</a></p>`;

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

  it("will support wikilinks whose path contains proper apostrophes", function (done) {
    const path = "/hello.txt";
    const html = '<p><a href="/target" class="wikilink">Hey</a></p>';

    const files = [
      { path: "/Target’s.md", content: "Link: target\n# Hey" },
      { path, content: "[[Target’s]]" },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

  it("will support wikilinks by title, ignoring case", function (done) {
    const path = "/hello.txt";

    const files = [
      { path: "/target.md", content: "Link: target\n# Title" },
      { path, content: "[[title]]" },
    ];

    const entry = {
      path,
      html: '<p><a href="/target" class="wikilink">Title</a></p>',
    };

    this.syncAndCheck(files, entry, done);
  });

  it("will support wikilinks by URL", function (done) {
    const path = "/hello.txt";

    const files = [
      { path: "/target.md", content: "Link: target\n# Title" },
      { path, content: "[[Target]]" },
    ];

    const entry = {
      path,
      html: '<p><a href="/target" class="wikilink">Title</a></p>',
    };

    this.syncAndCheck(files, entry, done);
  });

  it("will support wikilinks with a fuzzy match for the path", function (done) {
    const path = "/Subdirectory/Source.md";
    const tests = [
      "[[Target_file]]",
      "[[Target-file]]",
      "[[Target file]]",
      "[[tArget!file]]",
      "[[/Subdirectory/tArget!file]]",
      "[[/Subdirectory/Target_file]]",
      "[[/Subdirectory/Target file]]",
      "[[/Subdirectory/Target-file]]",
    ];
    const content = tests.join("\n");

    const linkPath = "/Subdirectory/Target_file.txt";
    const linkContent = "Link: target\n\n# Target\n\nThe linked file.";

    // We know that Blot has worked out which file to link to
    // because the href is set to target and the link text to Target!
    const html =
      "<p>" +
      Array.from(Array(tests.length))
        .map((i) => '<a href="/target" class="wikilink">Target</a>')
        .join(" ") +
      "</p>";

    const files = [
      { path: linkPath, content: linkContent },
      { path, content },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

  // Pandoc maps Target's to Target’s before the wikilinks plugin gets ahold
  // of the HTML which breaks the path, so wikilinks handles this.
  it("will support wikilinks whose path contains fake apostrophes", function (done) {
    const path = "/hello.txt";
    const html = '<p><a href="/target" class="wikilink">Hey</a></p>';

    const files = [
      { path: "/Target's.md", content: "Link: target\n# Hey" },
      { path, content: "[[Target's]]" },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
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

  it("turns absolute wikilinks into links", function (done) {
    const path = "/Sub/Source.md";
    const tests = [
      // Absolute perfect path without extension
      "[[/Sub/child/Target]]",
      // Absolute perfect path with extension
      "[[/Sub/child/Target.txt]]",
      // Absolute path with bad case
      "[[/sUb/child/taRget]]",
      // Absolute path with bad case and extension
      "[[/sUb/child/taRget.txt]]",
      // Absolute path with extra slashes
      "[[//Sub/child//Target.txt/]]",
      // Absolute perfect path without extension and leading slash
      "[[Sub/child/Target]]",
      // Absolute perfect path with extension and without leading slash
      "[[Sub/child/Target.txt]]",
      // Absolute path with bad case and without leading slash
      "[[sUb/child/taRget]]",
      // Absolute path with bad case and extension and without leading slash
      "[[sUb/child/taRget.txt]]",
      // Absolute path with extra slashes and without leading slash
      "[[Sub//child//Target.txt/]]",
    ];

    const content = tests.join("\n");

    const linkPath = "/Sub/child/Target.txt";
    const linkContent = "Link: not-target\n\n# Not target\n\nThe linked file.";

    // We know that Blot has worked out which file to link to
    // because the href is set to target and the link text to Target!
    const html =
      "<p>" +
      Array.from(Array(tests.length))
        .map((i) => '<a href="/not-target" class="wikilink">Not target</a>')
        .join(" ") +
      "</p>";

    const files = [
      { path: linkPath, content: linkContent },
      { path, content },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

  it("supports relative wikilinks in subdirectory", function (done) {
    const path = "/Sub/Source.md";
    const tests = [
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
    ];
    const content = tests.join("\n");

    const linkPath = "/Sub/child/Target.md";
    const linkContent = "Link: target\n\n# Target\n\nThe linked file.";

    // We know that Blot has worked out which file to link to
    // because the href is set to target and the link text to Target!
    const html =
      "<p>" +
      Array.from(Array(tests.length))
        .map((i) => '<a href="/target" class="wikilink">Target</a>')
        .join(" ") +
      "</p>";

    const files = [
      { path: linkPath, content: linkContent },
      { path, content },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

  it("supports relative wikilinks in same directory", function (done) {
    const path = "/Sub/Source.md";
    const tests = [
      // Relative perfect path
      "[[./Target]]",
      // Relative perfect path with extension
      "[[./Target.md]]",
      // Relative path with bad case
      "[[./target]]",
      // Relative path with bad case and extension
      "[[./target.md]]",
      // Relative path without dot-slash
      "[[Target]]",
      // Relative path without dot-slash and extension
      "[[Target.md]]",
      // Relative path with bad case and without dot-slash
      "[[target]]",
      // Relative path without bad case and dot-slash but extension
      "[[target.md]]",
    ];
    const content = tests.join("\n");

    const linkPath = "/Sub/Target.md";
    const linkContent = "Link: target\n\n# Target\n\nThe linked file.";

    // We know that Blot has worked out which file to link to
    // because the href is set to target and the link text to Target!
    const html =
      "<p>" +
      Array.from(Array(tests.length))
        .map((i) => '<a href="/target" class="wikilink">Target</a>')
        .join(" ") +
      "</p>";

    const files = [
      { path: linkPath, content: linkContent },
      { path, content },
    ];

    const entry = { path, html };

    this.syncAndCheck(files, entry, done);
  });

  it("supports relative wikilinks in a parent directory", function (done) {
    const path = "/Sub/Deep/Source.md";
    const tests = [
      // Relative perfect path
      "[[../Target]]",
      // Relative perfect path with extension
      "[[../Target.md]]",
      // Relative path with bad case
      "[[../target]]",
      // Relative path with bad case and extension
      "[[../target.md]]",
      // Relative path without dot-slash
      "[[../../Sub/Target]]",
      // Relative path without dot-slash and extension
      "[[../../Sub/Target.md]]",
      // Relative path with bad case and without dot-slash
      "[[../../Sub/target]]",
      // Relative path without bad case and dot-slash but extension
      "[[../../Sub/target.md]]",
    ];
    const content = tests.join("\n");

    const linkPath = "/Sub/Target.md";
    const linkContent = "Link: target\n\n# Target\n\nThe linked file.";

    // We know that Blot has worked out which file to link to
    // because the href is set to target and the link text to Target!
    const html =
      "<p>" +
      Array.from(Array(tests.length))
        .map((i) => '<a href="/target" class="wikilink">Target</a>')
        .join(" ") +
      "</p>";

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
