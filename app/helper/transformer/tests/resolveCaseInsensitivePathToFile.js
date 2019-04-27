describe("transformer ", function() {
  // Creates test environment
  require("./setup")({});

  var resolveCaseInsensitivePathToFile = require("../resolveCaseInsensitivePathToFile");
  var fs = require("fs-extra");
  var async = require("async");

  it("resolves case insensitive paths to a file", function(done) {
    var cwd = this.blogDirectory;

    // We have to use globally unique names for each directory
    // since on case-insensitive file systems you can clobber
    // an existing test case with a new case
    async.timesSeries(
      100,
      function(i, next) {
        var truePath = global.test.fake.path(Date.now().toString() + ".txt");
        var randomizedPath = randomizeCase(truePath);
        fs.outputFileSync(cwd + truePath, "");

        resolveCaseInsensitivePathToFile(cwd, randomizedPath, function(
          err,
          resolvedPath
        ) {
          if (err) return done.fail(err);

          expect(resolvedPath).toEqual(cwd + truePath);
          fs.emptyDirSync(cwd);
          next();
        });
      },
      done
    );
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
