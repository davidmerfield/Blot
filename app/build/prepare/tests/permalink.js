describe("title parser", function () {
  var Permalink = require("../permalink");

  global.test.blog();

  it("generates a permalink from the entry's path", function () {
    let entry = {
      path: "/[design]/bar.txt",
      name: "bar.txt",
      size: 123,
      html: "",
      updated: 123,
      draft: false,
      metadata: {},
    };

    let permalink = Permalink(this.blog.timeZone, "{{stem}}", entry);

    expect(permalink).toEqual("/design/bar");
  });

  it("generates a permalink from the entry's path", function () {
    let entry = {
      path: "/[design]/bar.txt",
      name: "bar.txt",
      size: 123,
      html: "",
      updated: 123,
      draft: false,
      metadata: {},
    };

    let permalink = Permalink(
      this.blog.timeZone,
      "{{path-without-extension}}",
      entry
    );

    expect(permalink).toEqual("/[design]/bar");
  });
});
