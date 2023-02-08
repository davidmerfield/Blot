describe("pathNormalizer", function () {
  const pathNormalizer = require("helper/pathNormalizer");
  const is = require("./util/is")(pathNormalizer);

  it("works", function () {
    // Sanity
    is("/", "/");
    is("/foo", "/foo");
    is("/foo/bar", "/foo/bar");

    // Trim leading or trailing whitespace
    is(" / ", "/");

    // Preserve internal whitespace
    is("/a b c", "/a b c");

    // Remove trailing slash
    is("/foo/", "/foo");

    // Add leading slash
    is("foo", "/foo");

    // Preserve case
    is("/BaR", "/BaR");

    // Replace double slashes with single slashes
    is("//foo//bar//", "/foo/bar");

    // Preserve non alphanum characters
    is("/←→", "/←→");
    is("使/用/百/度/馈/", "/使/用/百/度/馈");

    // Preserve url encoding
    is("/%20a%20b", "/%20a%20b");
  });
});
