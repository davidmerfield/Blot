describe("transformer ", function() {
  // Creates test environment
  require("./setup")({});

  var resolveCaseInsensitivePathToFile = require("../resolveCaseInsensitivePathToFile");
  var fs = require("fs-extra");

  it("resolves case insensitive paths to a file", function(done) {
    var path = "/foo/Bar/baz.jpg";
    var randomizedPath = randomizeCase(path);
    var cwd = this.blogDirectory;

    fs.outputFileSync(cwd + path, "");

    resolveCaseInsensitivePathToFile(cwd, randomizedPath, function(
      err,
      resolvedPath
    ) {
      if (err) return done.fail(err);

      expect(resolvedPath).toEqual(cwd + path);
      done();
    });
  });
});

function randomizeCase(str) {
  return str
    .split("/")
    .map(function(s) {
      for (var i = 0; i < s.length; i++) {
        if (Math.random() > 0.5) {
          s = s.split(s[i]).join(s[i].toLowerCase());
        } else {
          s = s.split(s[i]).join(s[i].toUpperCase());
        }
      }
      return s;
    })
    .join("/");
}
