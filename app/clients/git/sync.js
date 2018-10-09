var async = require("async");
var Sync = require("sync");
var debug = require("debug")("clients:git:sync");
var Git = require("simple-git");
var checkGitRepoExists = require("./checkGitRepoExists");

module.exports = function sync(blogID, callback) {
  // Attempt to acquire a lock on the blog's folder
  // to apply updates to it... These options are
  // redlock options to ensure we acquire a lock eventually...
  Sync(blogID, { retryCount: -1, retryDelay: 10, retryJitter: 10 }, function(
    err,
    folder,
    done
  ) {
    // Typically, this error means were unable to acquire a lock
    // on the folder, perhaps another process is syncing it...
    if (err) return callback(err);

    debug("beginning sync");
    checkGitRepoExists(folder.path, function(err) {
      if (err) return done(err, callback);

      var git;

      // Throws an error if directory does not exist
      try {
        git = Git(folder.path).silent(true);
      } catch (err) {
        return done(err, callback);
      }

      debug("fetching latest commit hash");
      git.raw(["rev-parse", "HEAD"], function(err, headBeforePull) {
        if (err) {
          debug(err);
          return done(new Error(err), callback);
        }

        if (!headBeforePull)
          return done(new Error("No commit on repository"), callback);

        // Remove whitespace from stdout
        headBeforePull = headBeforePull.trim();

        // My goal is to update the working tree in the blog folder
        // to the remote's version of the repo. There should never be
        // unpushed or uncommitted changes here, hence the reset. I
        // took these two commands (fetch and then reset) from this answer:
        // https://stackoverflow.com/a/8888015
        git.fetch({ "--all": true }, function(err) {
          if (err) {
            debug(err);
            return done(new Error(err), callback);
          }

          git.raw(["reset", "--hard", "origin/master"], function(err) {
            if (err) {
              debug(err);
              return done(new Error(err), callback);
            }

            git.raw(["rev-parse", "HEAD"], function(err, headAfterPull) {
              if (err) return done(new Error(err), callback);

              if (!headAfterPull)
                return done(new Error("No commits on repository"), callback);

              // Remove whitespace from stdout
              headAfterPull = headAfterPull.trim();

              if (headAfterPull === headBeforePull) {
                debug("Warning: No changes detected to bare repository");
                return done(null, callback);
              }

              git.raw(
                [
                  "diff",
                  "--name-status",
                  "--no-renames",
                  headBeforePull + ".." + headAfterPull
                ],
                function(err, res) {
                  if (err) return done(new Error(err), callback);

                  var modified = [];

                  // If you push an empty commit then res
                  // will be null, or perhaps a commit and
                  // then a subsequent commit which reverts
                  // the previous commit.
                  if (res === null) {
                    return done(null, callback);
                  }

                  res.split("\n").forEach(function(line) {
                    // A = added, M = modified, D = deleted
                    // Blot only needs to know about changes...
                    if (
                      ["A", "M", "D"].indexOf(line[0]) > -1 &&
                      line[1] === "\t"
                    ) {
                      modified.push(line.slice(2));
                    } else {
                      debug("Nothing found for line:", line);
                    }
                  });

                  debug("Passing modifications to Blot:", modified);

                  // Tell Blot something has changed at these paths!
                  // We must do this in series until entry.set becomes
                  // atomic. Right now, making changes to the blog's
                  // menu cannot be done concurrently, hence eachSeries!
                  async.eachSeries(modified, folder.update, function(err) {
                    debug(
                      "Processed all modifications! Release lock on folder..."
                    );

                    done(null, callback);
                  });
                }
              );
            });
          });
        });
      });
    });
  });
};
