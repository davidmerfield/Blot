const client = require("client");
const buildFromFolder = require("template").buildFromFolder;
const Blog = require("blog");
const Update = require("./update");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const uuid = require("uuid/v4");
const renames = require("./renames");
const lockfile = require("proper-lockfile");
const type = require("helper/type");
const email = require('helper/email');

function sync(blogID, callback) {
  if (!type(blogID, "string")) {
    throw new TypeError("Expected blogID with type:String as first argument");
  }

  if (!type(callback, "function")) {
    throw new TypeError(
      "Expected callback with type:Function as second argument"
    );
  }

  const syncID = "sync_" + uuid().slice(0, 7);
  const log = function () {
    console.log.apply(null, [
      clfdate(),
      blogID.slice(0, 12),
      syncID,
      ...arguments,
    ]);
  };

  log("Starting sync, fetching blog information");

  Blog.get({ id: blogID }, async function (err, blog) {
    // It would be nice to get an error from Blog.get instead of this...
    if (err || !blog || !blog.id || blog.isDisabled) {
      log("Error with blog's ability to sync");
      return callback(new Error("Cannot sync blog " + blogID));
    }

    let release;

    try {
      log("Acquiring lock on folder");
      release = await lockfile.lock(localPath(blogID, "/"));
      log("Successfully acquired lock on folder");
    } catch (e) {
      log("Failed to acquire lock on folder");
      return callback(new Error("Failed to acquire folder lock"));
    }

    const folder = {
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
    client.publish("sync:status:" + blogID, "Syncing");

    // Pass methods to trigger folder updates back to the
    // function which wanted to modify the blog's folder.
    callback(null, folder, function (syncError, callback) {
      log("Sync callback invoked");
      client.publish("sync:status:" + blogID, "Synced");

      if (typeof syncError === "function")
        throw new Error("Pass an error or null as first argument to done");

      if (typeof callback !== "function")
        throw new Error("Pass a callback to done");

      setTimeout(function () {
        log("Warning: sync exceeded 10 minutes");
        email.LONG_SYNC();
      }, 10 * 60 * 1000); // 10 minutes

      log("Checking for renamed files");
      renames(blogID, async function (err) {
        if (err) {
          log("Error checking file renames");
          log("Releasing lock");
          await release();
          return callback(err);
        }

        // What is the appropriate order for this?
        log("Building templates from folder");
        buildFromFolder(blogID, async function (err) {
          if (err) {
            log("Error building templates from folder");
            log("Releasing lock");
            await release();
            return callback(err);
          }

          const cacheID = Date.now();

          // Passing in cacheID manually busts the cache.
          // Since Blog.set and Blog.flushCache depend on each other
          // we can't put this there. Ideally we would expose a single function to
          // wipe the cache. So fix that eventually...
          log("Updating cacheID of blog");
          Blog.set(blogID, { cacheID }, async function (err) {
            if (err) {
              log("Error updating cacheID of blog");
              log("Releasing lock");
              await release();
              return callback(err);
            }

            // We could do these next two things in parallel
            // but it's a little bit of refactoring...
            log("Releasing lock");
            await release();
            log("Finished sync");
            callback(syncError);
          });
        });
      });
    });
  });
}

module.exports = sync;
