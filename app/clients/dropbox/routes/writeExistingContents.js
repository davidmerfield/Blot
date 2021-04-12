var fs = require("fs-extra");
var async = require("async");
var debug = require("debug")("blot:clients:dropbox:writeExistingContents");
var sync = require("sync");
var upload = require("../util/upload");
var join = require("path").join;
var Metadata = require("metadata");
var Path = require("path");

module.exports = function (req, res, next) {
  var walk, walked, queue, localFolder, dropboxFolder, token;

  debug("writing existing contents for", req.blog.title);

  // check if req.account.folder === req.unsavedAccount.folder
  // if so, just next? we want people to be able to re-cruise
  // down this authentication route without freaking out...

  sync(req.blog.id, function (err, folder, done) {
    if (err) return next(err);

    localFolder = folder.path;
    token = req.unsavedAccount.access_token;
    dropboxFolder = req.unsavedAccount.folder;
    walked = false;

    queue = async.queue(function (task, callback) {
      upload(token, task.source, task.destination, callback);
    }, 5);

    queue.drain = function () {
      if (walked) {
        debug("drained queue with walk complete for", req.blog.title);
        done(null, next);
      }
    };

    walk = new walker(req.blog.id, localFolder, dropboxFolder, queue);

    walk("/", function (err) {
      if (err) return done(err, next);

      if (!queue.started) return done(null, next);

      walked = true;
    });
  });
};

// Takes a file or folder whose name is not fully
// lowercase and to make it lowercase. For example:
//
//      /foo/BaR.jpg --> /foo/bar.jpg
//
// This function is more complicated because we don't
// want to clobber /foo/bar/baz.jpg if it already exists
// so we run down a list of options. Returns the
// name of the lowercased file.
function ensureLowerCase(directory, name, callback) {
  var currentPath, parsedPath, names;

  if (name === name.toLowerCase()) return callback(null, name);

  currentPath = join(directory, name);
  parsedPath = Path.parse(currentPath);

  names = [
    name.toLowerCase(),
    parsedPath.name.toLowerCase() +
      " (conflict)" +
      parsedPath.ext.toLowerCase(),
  ];

  for (var i = 1; i < 100; i++) {
    names.push(
      parsedPath.name.toLowerCase() +
        " (conflict " +
        i +
        ")" +
        parsedPath.ext.toLowerCase()
    );
  }

  async.eachSeries(
    names,
    function (name, next) {
      fs.move(currentPath, join(directory, name), function (err) {
        if (err) return next();
        callback(null, name);
      });
    },
    function () {
      callback(
        new Error("Ran out of candidates to lowercase path: " + currentPath)
      );
    }
  );
}

function walker(blogID, localFolder, dropboxFolder, queue) {
  return function walk(path, callback) {
    debug("iterating", path);

    fs.readdir(localFolder + path, function (err, contents) {
      async.eachSeries(
        contents,
        function handleItem(name, next) {
          debug(". ", join(localFolder, path, name));

          // We lowercase the local path to the file because
          // when the Dropbox client syncs, it writes lowercase
          // files only. Without this step, you end up with duplicated
          // files and folders, one case-preserved, one lowercase
          ensureLowerCase(join(localFolder, path), name, function (err, name) {
            if (err) return next(err);

            fs.stat(join(localFolder, path, name), function (err, stat) {
              if (err) return next(err);

              if (stat.isDirectory()) {
                return walk(join(path, name), next);
              }

              // Fetches case-preserved name of the file
              Metadata.get(blogID, join(path, name), function (
                err,
                casePreservedName
              ) {
                queue.push({
                  source: join(localFolder, path, name),
                  destination: join(
                    dropboxFolder,
                    path,
                    casePreservedName || name
                  ),
                });

                next();
              });
            });
          });
        },
        callback
      );
    });
  };
}
