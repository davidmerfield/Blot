describe("build", function () {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  beforeEach(function () {
    this.buildAndCheck = ({ path, contents }, expectedEntry, cb) => {
      fs.outputFileSync(this.blogDirectory + path, contents);
      build({data: {blog: this.blog, path, options: {}}}, function (err, entry) {
        for (let key in expectedEntry)
          expect(expectedEntry[key]).toEqual(entry[key]);
        cb();
      });
    };
  });

  it("will convert wikilinks if plugin is enabled", function (done) {
    const contents = "A [[wikilink]]";
    const path = "/hello.txt";
    const html = '<p>A <a href="wikilink" class="wikilink">wikilink</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will convert multiple wikilinks on one line", function (done) {
    const contents = "A [[wikilink]] and [[another|one]]";
    const path = "/hello.txt";
    const html =
      '<p>A <a href="wikilink" class="wikilink">wikilink</a> and <a href="another" class="wikilink">one</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will ignore wikilinks spanning multiple lines", function (done) {
    const contents = "[[wiki\n\nhey]]";
    const path = "/hello.txt";
    const html =
      '<p>[[wiki</p>\n<p>hey]]</p>';

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

  it("will convert wikilinks whose path contains square brackets", function (done) {
    const contents = "[[../[snips]/wikilink]]";
    const path = "/hello.txt";
    const html =
      '<p><a href="../[snips]/wikilink" class="wikilink">../[snips]/wikilink</a></p>';

    this.blog.plugins.wikilinks = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will turn titles into title case if plugin is enabled", function (done) {
    const contents = "# Title goes here";
    const path = "/hello.txt";
    const html = '<h1 id="title-goes-here">Title Goes Here</h1>';

    this.blog.plugins.titlecase = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });

  it("will turn titles with nested children into title case if plugin is enabled", function (done) {
    const contents = "# Title *goes [with](/here)* children";
    const path = "/hello.txt";
    const html = '<h1 id="title-goes-with-children">Title <em>Goes <a href="/here">With</a></em> Children</h1>';

    this.blog.plugins.titlecase = { enabled: true, options: {} };
    this.buildAndCheck({ path, contents }, { html }, done);
  });
});
