var yesno = require("yesno");
var Entries = require("../../../app/models/entries");
var Entry = require("../../../app/models/entry");
var localPath = require("helper").localPath;
var fs = require("fs");
var async = require("async");
var host = require("../../../config").host;

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

  async.detect(
    candidates,
    function(filePath, callback) {
      fs.access(localPath(blogID, filePath), function(err) {
        callback(null, !err);
      });
    },
    function(err, match) {
      if (err || !match) {
        return callback(err || new Error("ENOENT: " + path));
      }
      callback(null, match);
    }
  );
}
// The purpose of this script was to resolve an issue with entries having
// path properties that were not equal to the location of the file on disk
// if the file system is case sensitive.
function main(blog, callback) {
  yesno.options.yes = [blog.handle];
  var missing = [];
  var edit = [];

  var domain = "http://" + blog.handle + "." + host;
  console.log("Blog", blog.id, "(" + domain + ") Fixing entries");

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
          missing.push({ entry: _entry, path: _entry.path });
        }
        next();
      });
    },
    function(err) {
      if (err) return callback(err);

      if (!missing.length && !edit.length) {
        return callback();
      }

      var message = [blog.id, blog.title, blog.handle];

      if (missing.length) {
        message.push(
          missing.length +
            " files are missing from the disk for entries which are not deleted"
        );
        message = message.concat(missing.map(log));
      }

      if (edit.length) {
        message.push(
          edit.length + "files exists on disk with a different case.."
        );
        message = message.concat(edit.map(log));
      }

      message.push(
        "Would you like to resolve these issues? Please type the blog handle (" +
          blog.handle +
          ") to confirm:"
      );

      function log(i) {
        return "\n- Path: " + i.path + "\n- Entry: " + domain + i.entry.url;
      }
      yesno.ask(message.join("\n"), false, function(yes) {
        if (!yes) {
          return callback(new Error("\nDid not apply changes"));
        }

        async.eachSeries(
          edit,
          function(item, next) {
            Entry.set(blog.id, item.entry.path, { path: item.path }, next);
          },
          function(err) {
            if (err) return callback(err);

            async.eachSeries(
              missing,
              function(item, next) {
                Entry.drop(blog.id, item.entry.path, next);
              },
              callback
            );
          }
        );
      });
    }
  );
}

module.exports = main;
