var async = require("async");
var Sync = require("sync");
var debug = require("debug")("clients:git:sync");
var Git = require("simple-git");
var checkGitRepoExists = require("./checkGitRepoExists");
var UNCOMMITED_CHANGES =
  "Please commit your changes or stash them before you merge.";

module.exports = function sync(blog, callback) {
  Sync(blog.id, main(blog), callback);
};

function main (blog) {
  return function(blogDirectory, update, callback) {
    debug("beginning sync");
    checkGitRepoExists(blog.id, function(err) {
      if (err) return callback(err);

      var git;

      // Throws an error if directory does not exist
      try {
        git = Git(blogDirectory).silent(true);
      } catch (err) {
        return callback(err);
      }

      debug("fetching latest commit hash");
      git.raw(["rev-parse", "HEAD"], function(err, headBeforePull) {
        if (err) return callback(new Error(err));

        if (!headBeforePull)
          return callback(new Error("No commit on repository"));

        // Remove whitespace from stdout
        headBeforePull = headBeforePull.trim();

        git.pull(function handlePull(err) {
          if (err && err.indexOf(UNCOMMITED_CHANGES) > -1) {
            // From https://git-scm.com/docs/git-reset
            // Resets the index and working tree. Any changes to tracked files in the
            // working tree since <commit> are discarded.
            // This should not mess with files in gitignore.
            debug("Uncommitted changes error:", err);
            debug("Calling git reset hard now:");
            return git.reset("hard", function(err) {
              if (err) return callback(new Error(err));

              debug("Reset succeeded, retrying pull...");
              git.pull(handlePull);
            });
          }

          if (err) return callback(new Error(err));

          git.raw(["rev-parse", "HEAD"], function(err, headAfterPull) {
            if (err) return callback(new Error(err));

            // Remove whitespace from stdout
            headAfterPull = headAfterPull.trim();

            if (headAfterPull === headBeforePull) {
              debug("Warning: No changes detected to bare repository");
              return callback(null);
            }

            git.raw(
              [
                "diff",
                "--name-status",
                "--no-renames",
                headBeforePull + ".." + headAfterPull
              ],
              function(err, res) {
                if (err) return callback(new Error(err));

                var modified = [];

                // If you push an empty commit then res
                // will be null, or perhaps a commit and
                // then a subsequent commit which reverts
                // the previous commit.
                if (res === null) {
                  return callback(null);
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

                // Tell Blot something has changed at these paths!
                async.eachSeries(modified, update, function(err){
                  // we don't want an error to stop us processing files
                  callback(null);
                });
              }
            );
          });
        });
      });
    });
  };
}
