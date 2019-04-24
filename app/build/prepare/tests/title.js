describe("title parser", function() {
  var cheerio = require("cheerio");
  var Title = require("../title");

  beforeEach(function() {
    this.title = function(html, path) {
      var $ = cheerio.load(html, { decodeEntities: false });
      return Title($, path || "/Hello.txt");
    };
  });

  it("parses a title", function() {
    expect(this.title("<h1>Hello</h1><p>Foo</p>")).toEqual({
      title: "Hello",
      tag: "<h1>Hello</h1>",
      body: "<p>Foo</p>"
    });
  });

  it("parses a title from HTML without an h1 tag", function() {
    expect(this.title("<p>Foo</p>")).toEqual({
      title: "Foo",
      tag: "",
      body: "<p>Foo</p>"
    });
  });

  it("handles nested children in the H1 tag", function() {
    expect(this.title("<h1>A<span>C<i>D</i></span></h1>")).toEqual({
      title: "ACD",
      tag: "<h1>A<span>C<i>D</i></span></h1>",
      body: ""
    });
  });

  it("preserves attributes on title element", function() {
    expect(this.title('<h1 id="foo" data-bar="baz">Bar</h1>')).toEqual({
      title: "Bar",
      tag: '<h1 id="foo" data-bar="baz">Bar</h1>',
      body: ""
    });
  });

  it("handles an h1 tag that is not the first node", function() {
    expect(
      this.title("<p>Bar</p><h1>Bat</h1><h2>Foo</h2><p>count</p>")
    ).toEqual({
      title: "Bat",
      tag: "<h1>Bat</h1>",
      body: "<p>Bar</p><h2>Foo</h2><p>count</p>"
    });
  });

  it("handles an h1 tag that is nested", function() {
    expect(
      this.title("<div><section><h1>Hey</h1></section><p>World</p></div>")
    ).toEqual({
      title: "Hey",
      tag: "<h1>Hey</h1>",
      body: "<div><section></section><p>World</p></div>"
    });
  });

  it("falls back to the file's name for text-less files", function() {
    expect(
      this.title("<a href=\"/\"></a>", "/Another.txt")
    ).toEqual({
      title: "Another",
      tag: "",
      body: "<a href=\"/\"></a>"
    });
  });

  it("falls back to the file's name for empty files", function() {
    expect(
      this.title("", "/Hello.txt")
    ).toEqual({
      title: "Hello",
      tag: "",
      body: ""
    });
  });

   it("ignores tags in the file's name when falling back", function() {
    expect(
      this.title("", "/[foo]Hello[bar].txt")
    ).toEqual({
      title: "Hello",
      tag: "",
      body: ""
    });
  });
});