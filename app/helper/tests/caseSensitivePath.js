describe("caseSensitivePath ", function () {
  // Creates test environment
  require("../transformer/tests/setup")({});

  var resolveCaseInsensitivePathToFile = require("../caseSensitivePath");
  var fs = require("fs-extra");
  var async = require("async");

  it("resolves case insensitive paths to a file", function (done) {
    var cwd = this.blogDirectory;

    async.timesSeries(
      100,
      function (i, next) {
        var truePath = global.test.fake.path(Date.now().toString() + ".txt");
        var randomizedPath = addSlashes(randomizeCase(truePath));
        fs.outputFileSync(cwd + truePath, "");

        resolveCaseInsensitivePathToFile(cwd, randomizedPath, function (
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

function addSlashes(path) {
  path = path
    .split("/")
    .map(function (str) {
      if (coinFlip()) str = str + "/";

      if (coinFlip()) str = "/" + str;

      return str;
    })
    .join("/");
  return path;
}

function coinFlip() {
  return Math.random() > 0.5;
}

function randomizeCase(str) {
  return str
    .split("/")
    .map(function (s) {
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
