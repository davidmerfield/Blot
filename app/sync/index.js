var client = require("client");
var buildFromFolder = require("template").buildFromFolder;
var Blog = require("blog");
var Update = require("./update");
var localPath = require("helper/localPath");
var clfdate = require("helper/clfdate");
var uuid = require("uuid/v4");
var renames = require("./renames");
var debug = require("debug")("blot:blog:sync");
const lockfile = require("proper-lockfile");

function sync(blogID, callback) {
  
  Blog.get({ id: blogID }, async function (err, blog) {
    // It would be nice to get an error from Blog.get instead of this...
    if (err || !blog || !blog.id || blog.isDisabled) {
      return callback(new Error("Cannot sync blog " + blogID));
    }

    let release;

    try {
      release = await lockfile.lock(localPath(blogID, "/"));
    } catch (e) {
      return callback(new Error("Failed to acquire lock to sync folder"));
    }

    var syncID = "sync_" + uuid().slice(0, 7);
    var log = function () {
      console.log.apply(null, [
        clfdate(),
        blogID.slice(0, 12),
        syncID,
        ...arguments,
      ]);
    };

    var folder = {
      path: localPath(blogID, "/"),
      update: new Update(blog, log),
      log,
    };

    // Right now localPath returns a path with a trailing slash for some
    // crazy reason. This means that we need to remove the trailing
    // slash for this to work properly. In future, you should be able
    // to remove this line when localPath works properly.
    if (folder.path.slice(-1) === "/") folder.path = folder.path.slice(0, -1);

    // We acquired a lock on the resource!
    // This function is to be called when we are finished
    // with the lock on the user's folder.
    folder.log("Started");
    client.publish("sync:status:" + blogID, "Sync started");

    callback(null, folder, function (syncError, callback) {
      folder.log("Released lock");
      client.publish("sync:status:" + blogID, "Sync complete");

      if (typeof syncError === "function")
        throw new Error("Pass an error or null as first argument to done");

      if (typeof callback !== "function")
        throw new Error("Pass a callback to done");

      renames(blogID, async function (err) {
        if (err) return callback(err);

        // We could do these next two things in parallel
        // but it's a little bit of refactoring...
        await release();

        // What is the appropriate order for this?
        buildFromFolder(blogID, function (err) {
          if (err) return callback(err);

          // Passing in cacheID manually busts the cache.
          // Since Blog.set and Blog.flushCache depend on each other
          // we can't put this there. Ideally we would expose a single function to
          // wipe the cache. So fix that eventually...
          Blog.set(blogID, { cacheID: Date.now() }, function (err) {
            if (err) return callback(err);

            folder.log("Finished");
            callback(syncError);
          });
        });
      });
    });
  });
}

module.exports = sync;
