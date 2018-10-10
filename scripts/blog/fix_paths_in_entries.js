var get = require("./get");
var Entries = require("../../app/models/entries");
var Entry = require("../../app/models/entry");
var localPath = require("../../app/helper").localPath;
var fs = require("fs");
var async = require("async");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function resolvePath(blogID, path, callback) {
  var candidates = [];

  candidates.push(path);
  // try removing leading whitespace
  candidates.push(path.trim());

  // 1 /Foo/Bar/Baz/Bat.jpg
  // - /Foo/Bar/Baz/bat.jpg
  // - /Foo/Bar/baz/bat.jpg
  // - /Foo/bar/baz/bat.jpg
  // - /foo/bar/baz/bat.jpg

  if (path.toLowerCase() !== path) {
    var dirs = path.split("/");

    for (var i = dirs.length - 1; i >= 0; i--) {
      dirs[i] = dirs[i].toLowerCase();
      candidates.push(dirs.join("/"));
      candidates.push(dirs.join("/").trim());
    }
  }

  console.log(candidates);

  async.detect(
    ["file1", "file2", "file3"],
    function(filePath, callback) {
      fs.access(localPath(blogID, filePath), function(err) {
        callback(null, !err);
      });
    },
    callback
  );
}
// The purpose of this script was to resolve an issue with entries having
// path properties that were not equal to the location of the file on disk
// if the file system is case sensitive.
function main(blog, callback) {
  console.log("Blog " + blog.id + ":", "Fixing bad case in entries...");

  var exists = [];
  var missing = [];
  var edit = [];

  Entries.each(
    blog.id,
    function(_entry, next) {
      // The file definitely no longer exists so we can't do
      // anything now...
      if (_entry.deleted) return next();

      resolvePath(blog.id, _entry.path, function(err, path) {
        if (path && path !== _entry.path) {
          edit.push({ entry: _entry, path: path });
        } else if (err) {
          missing.push(_entry);
        } else {
          exists.push(_entry);
        }

        next();
      });
    },
    function(err) {
      if (err) return callback(err);
      console.log(exists.length, " files exist on disk with same case");
      console.log(missing.length, " files are missing from the disk", missing);
      console.log(edit.length, "files exists on disk with a different case..");
      async.eachSeries(
        edit,
        function(item, next) {
          console.log("would call entry set!", item.entry.path, '>', item.path);
          next();
          // Entry.set(blog.id, item.entry.path, { path: item.path }, next);
        },
        function(err) {
          console.log("Blog " + blog.id + ":", "Fixed all entries!");
          callback();
        }
      );
    }
  );
}

module.exports = main;
