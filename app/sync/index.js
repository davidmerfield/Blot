var client = require("client");
var Redlock = require("redlock");
var buildFromFolder = require("../modules/template").update;
var Blog = require("blog");
var Update = require("./update");
var localPath = require("helper").localPath;
var async = require("async");

// By default, we give a sync process up to
// 10 minutes to compete before we allow other
// attempts to modify the folder to succeed.
var DEFAULT_TTL = 10 * 60 * 1000;

// Store reference to locks created by this process
// If we don't do this, the blog will not be able
// to sync until the TTL above expires.
var locks = {};

process.on("SIGINT", unlockAll); // catch ctrl-c
process.on("SIGTERM", unlockAll); // catch kill
process.on("uncaughtException", unlockAll); // catch runtime error

function unlockAll(err) {
  var exitCode = 0;

  console.log("Unlocking all locks...");

  async.eachOf(
    locks,
    function(lock, blogID, next) {
      console.log("Unlocking", blogID, "...");
      lock.unlock(next);
    },
    function() {
      if (err) {
        console.error(err);
        exitCode = 1;
      }

      process.exit(exitCode);
    }
  );
}

function sync(blogID, options, callback) {
  var redlock, resource, ttl, folder;

  if (typeof options === "function" && typeof callback === "undefined") {
    callback = options;
    options = {};
  }
  ttl = options.ttl || DEFAULT_TTL;
  options = options || {};

  resource = "blog:" + blogID + ":lock";

  redlock = new Redlock([client], {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: options.driftFactor || 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: options.retryCount || 10,

    // the time in ms between attempts
    retryDelay: options.retryDelay || 200, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: options.retryJitter || 200 // time in ms
  });

  Blog.get({ id: blogID }, function(err, blog) {
    // It would be nice to get an error from Blog.get instead of this...
    if (err || !blog || !blog.id || blog.isDisabled) {
      return callback(new Error("Cannot sync blog " + blogID));
    }

    redlock.lock(resource, ttl, function(err, lock) {
      // We failed to acquire a lock on the resource
      if (err) return callback(err);

      // Store list of locks created by this process
      // so if it dies, we can unlock them all...
      locks[blogID] = lock;

      folder = {
        path: localPath(blogID, "/"),
        update: new Update(blog)
      };

      // Right now localPath returns a path with a trailing slash for some
      // crazy reason. This means that we need to remove the trailing
      // slash for this to work properly. In future, you should be able
      // to remove this line when localPath works properly.
      if (folder.path.slice(-1) === "/") folder.path = folder.path.slice(0, -1);

      // We acquired a lock on the resource!
      // This function is to be called when we are finished
      // with the lock on the user's folder.
      callback(null, folder, function(syncError, callback) {
        if (typeof syncError === "function")
          throw new Error("Pass an error or null as first argument to done");

        if (typeof callback !== "function")
          throw new Error("Pass a callback to done");

        // We could do these next two things in parallel
        // but it's a little bit of refactoring...
        lock.unlock(function(err) {
          if (err) return callback(err);

          // We no longer need to unlock if the process dies...
          delete locks[blogID];

          buildFromFolder(blogID, function(err) {
            if (err) return callback(err);

            Blog.flushCache(blogID, function(err) {
              if (err) return callback(err);

              callback(syncError);
            });
          });
        });
      });
    });
  });
}

module.exports = sync;
