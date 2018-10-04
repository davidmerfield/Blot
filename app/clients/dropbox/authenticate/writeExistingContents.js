var fs = require("fs-extra");
var async = require("async");
var debug = require("debug")("clients:dropbox:writeExistingContents");
var sync = require("sync");
var upload = require("../util/upload");
var join = require("path").join;
var Metadata = require("metadata");

module.exports = function(req, res, next) {
  var walk, walked, queue, localFolder, dropboxFolder, token;

  debug("writing existing contents for", req.blog.title);

  // check if req.account.folder === req.unsavedAccount.folder
  // if so, just next? we want people to be able to re-cruise
  // down this authentication route without freaking out...

  sync(req.blog.id, function(err, folder, done) {
    if (err) return next(err);

    localFolder = folder.path;
    token = req.unsavedAccount.access_token;
    dropboxFolder = req.unsavedAccount.folder;
    walked = false;

    queue = async.queue(function(task, callback) {
      upload(token, task.source, task.destination, callback);
    }, 5);

    queue.drain = function() {
      if (walked) {
        debug("drained queue with walk complete for", req.blog.title);
        done(null, next);
      }
    };

    walk = new walker(req.blog.id, localFolder, dropboxFolder, queue);

    walk("/", function(err) {
      if (err) return done(err, next);

      if (!queue.started) return done(null, next);

      walked = true;
    });
  });
};

function walker(blogID, localFolder, dropboxFolder, queue) {
  return function walk(path, callback) {
    debug("iterating", path);

    fs.readdir(localFolder + path, function(err, contents) {
      async.eachSeries(
        contents,
        function(name, next) {
          debug(". ", join(localFolder, path, name));

          fs.stat(join(localFolder, path, name), function(err, stat) {
            if (err) return next(err);

            if (stat.isDirectory()) {
              return walk(join(path, name), next);
            }

            // PRESERVE CASE ISING CALLS TO BLOT"S METADATA MODEL
            Metadata.get(blogID, join(path, name), function(
              err,
              casePreservedName
            ) {
              queue.push({
                source: join(localFolder, path, name),
                destination: join(
                  dropboxFolder,
                  path,
                  casePreservedName || name
                )
              });

              next();
            });
          });
        },
        callback
      );
    });
  };
}
