describe("pathNormalizer", function () {
  const pathNormalizer = require("helper/pathNormalizer");
  const is = require("./util/is")(pathNormalizer);

  it("works", function () {
    // Sanity
    is("/", "/");
    is("/foo", "/foo");
    is("/foo/bar", "/foo/bar");

    // Preserve internal whitespace
    is(" / ", "/ / ");
    is("/a b c", "/a b c");
    is("/a b c ", "/a b c ");
    is("//a b c /", "/a b c ");

    // Remove trailing slash
    is("/foo/", "/foo");

    // Add leading slash
    is("foo", "/foo");

    // Preserve case
    is("/BaR", "/BaR");

    // Replace double slashes with single slashes
    is("//foo//bar//", "/foo/bar");

    // Normalize UTF-8 characters
    is("/\u0041\u006d\u00e9\u006c\u0069\u0065", "/Amélie");
    is("/\u0041\u006d\u0065\u0301\u006c\u0069\u0065", "/Amélie");

    // Preserve non alphanum characters
    is("/←→", "/←→");
    is("使/用/百/度/馈/", "/使/用/百/度/馈");

    // Preserve url encoding
    is("/%20a%20b", "/%20a%20b");
  });
});
