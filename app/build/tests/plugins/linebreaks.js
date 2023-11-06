describe("linebreaks plugin", function () {
  require("./util/setup")();

  beforeEach(function () {
    this.blog.plugins.linebreaks = { enabled: true, options: {} };
  });

  afterEach(function () {
    this.blog.plugins.linebreaks = { enabled: false, options: {} };
  });

  it("will preserve linebreaks if enabled", function (done) {
    const contents = "A line\nwith a break";
    const path = "/hello.txt";
    const html = "<p>A line<br>\nwith a break</p>";

    this.buildAndCheck({ path, contents }, { html }, done);
  });
});
