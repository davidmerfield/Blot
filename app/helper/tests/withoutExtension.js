describe("withoutExtension", function () {
  const withoutExtension = require("helper/withoutExtension");
  const is = require("./util/is")(withoutExtension);

  it("works", function () {
    is("", "");
    is("bar.txt", "bar");
    is("foo", "foo");
    is("Foo.bar.baz", "Foo.bar");
    is("/foo/bar/baz.txt", "/foo/bar/baz");
    is("/foo/bar.foo.txt", "/foo/bar.foo");
    is("foo.bar/bar.baz", "foo.bar/bar");
  });
});
