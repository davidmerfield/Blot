var fs = require("fs");
var Path = require("path");

function resolveCaseInsensitivePathToFile(cwd, path, callback) {
  // Will do many things, importantly it will
  // replace double slashes, e.g. /a/b//c -> /a/b/c
  path = Path.normalize(path);
  cwd = Path.normalize(cwd);

  // We must remove a leading slash if it exists
  // otherwise splitting it by the slash will change
  // the results. '/a/b'.split('/') is ['', 'a', 'b']
  // while 'a/b'.split('/') is ['a', 'b']
  while (path[0] === "/") path = path.slice(1);
  while (path.slice(-1) === "/") path = path.slice(0, -1);

  // We must remove a trailing slash from the current
  // working directory to ensure paths mesh nicely
  while (cwd.slice(-1) === "/") cwd = cwd.slice(0, -1);

  var dirs = path.split("/");
  var name = dirs.shift();

  fs.readdir(cwd, function guess(err, contents) {
    if (err) return callback(err);
    var exactMatch;

    contents = contents.filter(function(item) {
      if (item === name) {
        exactMatch = item;
        return false;
      }

      return item.normalize().toLowerCase() === name.normalize().toLowerCase();
    });

    if (!exactMatch && !contents.length) {
      err = new Error("No path matches: " + path);
      err.code = "ENOENT";
      return callback(err);
    }

    if (exactMatch) {
      cwd += "/" + exactMatch;
    } else {
      cwd += "/" + contents.shift();
    }

    if (dirs.length) {
      name = dirs.shift();
      fs.readdir(cwd, guess);
    } else {
      callback(null, cwd);
    }
  });
}

module.exports = resolveCaseInsensitivePathToFile;
