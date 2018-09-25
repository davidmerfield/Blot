var async = require("async");
var Change = require("sync").change;
var Sync = require("sync");
var debug = require("debug")("clients:git:sync");
var Git = require("simple-git");
var Blog = require("blog");
var localPath = require("helper").localPath;
var checkGitRepoExists = require('./checkGitRepoExists');
var UNCOMMITED_CHANGES = 'Please commit your changes or stash them before you merge.';

module.exports = function sync(handle, callback) {
  console.log('SYNC: fetching blog');
  Blog.get({ handle: handle }, function(err, blog) {
    if (err) return callback(err);
    console.log('SYNC: invoked from route, attempting to aqcuire lock and sync');
    Sync(blog.id, main(blog), callback);
  });
};


function main(blog) {
  return function(callback) {

    checkGitRepoExists(blog.id, function(err){

      if (err) return callback(err);

      var git;

      // Throws an error if directory does not exist
      try {        
        git = Git(localPath(blog.id, "/")).silent(true);
      } catch (err) {
        return callback(err);
      }

      git.raw(['rev-parse', 'HEAD'], function(err, headBeforePull){

        if (err) return callback(new Error(err));

        // Remove whitespace from stdout
        headBeforePull = headBeforePull.trim();

        git.pull(function handlePull (err) {

          if (err && err.indexOf(UNCOMMITED_CHANGES) > -1) {

            // From https://git-scm.com/docs/git-reset
            // Resets the index and working tree. Any changes to tracked files in the
            // working tree since <commit> are discarded.
            // This should not mess with files in gitignore.
            debug("Uncommitted changes error:", err);
            debug("Calling git reset hard now:");
            return git.reset('hard', function(err){

              if (err) return callback(new Error(err));

              debug("Reset succeeded, retrying pull...");
              git.pull(handlePull);
            });
          }

          if (err) return callback(new Error(err));

          git.raw(['rev-parse', 'HEAD'], function(err, headAfterPull){

            if (err) return callback(new Error(err));

            // Remove whitespace from stdout
            headAfterPull = headAfterPull.trim();

            if (headAfterPull === headBeforePull) {
              debug("Warning: No changes detected to bare repository");
              return callback();
            }

            git.raw(['diff', '--name-status', '--no-renames', headBeforePull + '..' + headAfterPull], function(err, res){

              if (err) return callback(new Error(err));
              
              var updated = [];
              var deleted = [];

              // If you push an empty commit then res
              // will be null, or perhaps a commit and 
              // then a subsequent commit which reverts
              // the previous commit.
              if (res === null) {
                return callback(null);
              }

              res.split('\n').forEach(function(line){

                if (line[0] === 'A' && line[1] === '\t') {
                  updated.push(line.slice(2));

                } else if (line[0] === 'M' && line[1] === '\t') {
                  updated.push(line.slice(2));
                  
                } else if (line[0] === 'D' && line[1] === '\t') {
                  deleted.push(line.slice(2));
                  
                } else {
                  debug('Nothing found for line:', line);
                }
              });

              debug('Deleted:', deleted);
              debug('Updated:', updated);

              async.eachSeries(
                updated,
                function(path, next) {
                  debug("Calling set with", blog.id, path);
                  Change.set(blog, path, function(err){
                    debug("Set returned error which we ignore", blog.id, path, err);
                    next();
                  });
                },
                function(err) {
                  if (err) return callback(err);

                  async.eachSeries(
                    deleted,
                    function(path, next) {
                      debug("Calling drop with", blog.id, path);
                      Change.drop(blog.id, path, function(err){
                        debug("Drop returned error which we ignore", blog.id, path, err);
                        next();
                      });
                    },
                    callback
                  );
                }
              );
            });
          });
        });
      });
    });
  };
}
