/* 

// This function lets you acquire a lock on a blog's folder
// This prevents buggy behaviour when making changes.

sync(blogID, [options], function(err, folder, done){
    
  // if err, you could not acquire lock on folder

  folder.path = /var/blogs/blogID

  folder.update(path, function(){
  
  });
  
  // call done to release lock on folder
  done(err, callback);
});

It takes advantage of Blot's database and an implementation of
the redlock algorithm by Mike Marcacci https://redis.io/topics/distlock
*/

var client = require("client");
var Redlock = require("redlock");
var buildFromFolder = require("../modules/template").update;
var Blog = require("blog");
var Update = require("./update");
var localPath = require("helper").localPath;
var DEFAULT_TTL = 60 * 1000; // 1m
var async = require("async");

// If we don't do this, the blog will not be able
// to sync until the TTL above expires.
process.on("SIGINT", unlock); // catch ctrl-c
process.on("SIGTERM", unlock); // catch kill

// Store reference to locks created by this process
var locks = {};

function unlock() {
  async.eachOf(
    locks,
    function(lock, blogID, next) {
      console.log(blogID, "Releasing lock...");
      lock.unlock(next);
    },
    function() {
      process.exit();
    }
  );
}

function sync(blogID, options, callback) {
  var redlock, resource;

  if (typeof options === "function" && typeof callback === "undefined") {
    callback = options;
    options = {};
  }

  options = options || {};

  resource = "blog:" + blogID + ":lock";

  // Wait means that we will give so many retries to acquire a lock
  // before returning an error. This number of retries is about 10s
  // worth and is enough that we might expect a user watching a spinner
  // to wait. This feature is used on the dashboard when modifying a client
  // settings. We'll wait to acquire a lock in that context rather than
  // immediately throwing an error, as we would during a folder sync.
  redlock = new Redlock([client], {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: options.driftFactor || 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: options.driftFactor || 10,

    // the time in ms between attempts
    retryDelay: options.driftFactor || 200, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: options.driftFactor || 200 // time in ms
  });

  var folder, done;

  Blog.get({ id: blogID }, function(err, blog) {
    // It would be nice to get an error from Blog.get instead of this...
    if (err || !blog || !blog.id || blog.isDisabled) {
      return callback(new Error("Cannot sync blog " + blogID));
    }

    redlock.lock(resource, options.ttl || DEFAULT_TTL, function(err, active_lock) {
      // We failed to acquire a lock on the resource
      if (err) return callback(err);

      // We acquired a lock on the resource!
      // This function is to be called when we are finished
      // with the lock on the user's folder.
      done = new Done(blogID, active_lock);

      folder = {
        path: localPath(blogID, "/"),
        update: new Update(blog)
      };

      // Right now localPath returns a path with a trailing slash for some
      // crazy reason. This means that we need to remove the trailing
      // slash for this to work properly. In future, you should be able
      // to remove this line when localPath works properly.
      if (folder.path.slice(-1) === "/") folder.path = folder.path.slice(0, -1);

      callback(null, folder, done);
    });
  });
}

function Done(blogID, lock) {
  // Store list of locks created by this process
  // so if it dies, we can unlock them all...
  locks[blogID] = lock;

  return function(syncError, callback) {
    if (typeof syncError === "function")
      throw new Error("Pass an error or null as first argument to done");

    if (typeof callback !== "function")
      throw new Error("Pass a callback to done");

    // We could do these next two things in parallel
    // but it's a little bit of refactoring...
    lock.unlock(function(err) {
      // We no longer need to unlock if the process dies...
      delete locks[blogID];

      // we weren 't able to reach redis; your lock will eventually
      // expire, but you probably want to log this error
      if (err) return callback(err);

      buildFromFolder(blogID, function(err) {
        if (err) return callback(err);

        Blog.flushCache(blogID, function(err) {
          if (err) return callback(err);

          callback(syncError);
        });
      });
    });
  };
}

module.exports = sync;
