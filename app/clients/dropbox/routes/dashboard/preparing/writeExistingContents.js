var fs = require("fs-extra");
var async = require("async");
var debug = require("debug")("blot:clients:dropbox:writeExistingContents");
var upload = require("clients/dropbox/util/upload");
var join = require("path").join;
var Metadata = require("metadata");
var Path = require("path");
var Entry = require("models/entry");
const Dropbox = require("dropbox").Dropbox;
const fetch = require("isomorphic-fetch");

module.exports = function (req, res, next) {
  var walk, walked, queue, localFolder, dropboxFolder, token;

  // The front-end listens for this message, so if you change it
  // also update views/preparing.html
  req.folder.status("Transferring the files in your blog folder");

  // check if req.account.folder === req.unsavedAccount.folder
  // if so, just next? we want people to be able to re-cruise
  // down this authentication route without freaking out...

  localFolder = req.folder.path;
  token = req.unsavedAccount.access_token;
  dropboxFolder = req.unsavedAccount.folder;
  const client = new Dropbox({ fetch });
  client.auth.setAccessToken(token);
  walked = false;

  queue = async.queue(function (task, callback) {
    console.log("here with task", task);
    req.folder.status("transferring", task.source);
    upload(client, task.source, task.destination, callback);
  });

  queue.drain = function () {
    if (walked) {
      console.log("drain invoked with walked =true");
      debug("drained queue with walk complete for", req.blog.title);
      // The front-end listens for this message, so if you change it
      // also update views/preparing.html
      req.folder.status("Transferred the files in your blog folder");
      next();
    } else {
      console.log("drain invoked with walked = false");
    }
  };

  walk = new walker(req.blog.id, localFolder, dropboxFolder, queue);

  walk("/", function (err) {
    if (err) return next(err);

    if (!queue.started) return next();

    walked = true;
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

function ensureLowerCase(blogID, localFolder, path, name, callback) {
  if (name === name.toLowerCase()) return callback(null, name);

  var currentPath, parsedPath, names;
  var originalName = name;
  var directory = join(localFolder, path);
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
      debug("attempting to move", currentPath, "to", join(directory, name));
      fs.rename(currentPath, join(directory, name), function (err) {
        if (err) {
          debug(err);
          return next();
        }

        let oldPath = join(path, originalName);
        let newPath = join(path, name);

        renameEntry(blogID, oldPath, newPath, name, function (err) {
          if (err) debug(err);

          // we need to rename the entry otherwise we get duplicates
          debug("successfully moved", currentPath, "to", join(directory, name));
          // The git client does not store the case-sensitive name
          // since it allows for case-sensitive files. The Dropbox
          // client does not however, so we save the original name in the db
          if (originalName.toLowerCase() === name && name !== originalName) {
            Metadata.add(blogID, newPath, originalName, function (err) {
              if (err) debug(err);
              debug("saved", originalName, "against", join(path, name));
              callback(null, name);
            });
          } else {
            callback(null, name);
          }
        });
      });
    },
    function () {
      callback(
        new Error("Ran out of candidates to lowercase path: " + currentPath)
      );
    }
  );
}

// When we lowercase a file, we need to update its entry
// as well, if one exists.
function renameEntry(blogID, oldPath, newPath, newName, callback) {
  debug("Attempting to rename", oldPath, "to", newPath);

  Entry.get(blogID, oldPath, function (entry) {
    if (!entry) {
      debug("No entry from", oldPath);
      return callback();
    }

    debug("Removing entry from", oldPath);
    Entry.drop(blogID, oldPath, function (err) {
      if (err) return callback(err);
      entry.path = newPath;
      entry.id = newPath;
      entry.name = newName;
      Entry.set(blogID, newPath, entry, callback);
    });
  });
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
          ensureLowerCase(blogID, localFolder, path, name, function (
            err,
            name
          ) {
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
