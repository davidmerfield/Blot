describe("resolve", function () {
  var resolve = require("../resolve");

  // tests for resolve

  function should_resolve_to(input) {
    it("should resolve to " + input.path, function () {
      var result = resolve(input.path, input.src);
      expect(result).toEqual(input.result);
    });
  }

  // Should resolve relative path
  should_resolve_to({
    src: "foo.jpg",
    path: "/foo/bar.txt",
    result: "/foo/foo.jpg",
  });

  should_resolve_to({
    src: "./foo.jpg",
    path: "/bar/baz/bat.txt",
    result: "/bar/baz/foo.jpg",
  });

  // Should not modify if invalid path
  should_resolve_to({
    src: "foo.jpg",
    path: "",
    result: "foo.jpg",
  });

  // Should resolve nested paths
  should_resolve_to({
    src: "foo/bar.mp4",
    path: "apps/this/that.txt",
    result: "/apps/this/foo/bar.mp4",
  });

  // Should not modify absolute paths
  should_resolve_to({
    src: "/foo/bar.mp4",
    path: "a/b/c/d/e/f",
    result: "/foo/bar.mp4",
  });

  // Should not modify empty strings
  should_resolve_to({
    src: "",
    path: "",
    result: "",
  });
});
