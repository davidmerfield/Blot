const client = require("client");
const buildFromFolder = require("template").buildFromFolder;
const Blog = require("blog");
const Update = require("./update");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const uuid = require("uuid/v4");
const renames = require("./renames");
const debug = require("debug")("blot:blog:sync");
const lockfile = require("proper-lockfile");
const type = require("helper/type");

 // Launch queue to process the building of entries
  const bull = require("bull");
  const buildQueue = new bull("build");

  buildQueue.process(require("helper/rootDir") + "/app/build/index.js");


function sync(blogID, callback) {
  if (!type(blogID, "string")) {
    throw new TypeError("Expected blogID with type:String as first argument");
  }

  if (!type(callback, "function")) {
    throw new TypeError(
      "Expected callback with type:Function as second argument"
    );
  }

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

    const syncID = "sync_" + uuid().slice(0, 7);
    const log = function () {
      console.log.apply(null, [
        clfdate(),
        blogID.slice(0, 12),
        syncID,
        ...arguments,
      ]);
    };

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
    folder.log("Started");
    client.publish("sync:status:" + blogID, "Syncing");

    // Pass methods to trigger folder updates back to the
    // function which wanted to modify the blog's folder.
    callback(null, folder, function (syncError, callback) {
      folder.log("Released lock");
      client.publish("sync:status:" + blogID, "Synced");

      if (typeof syncError === "function")
        throw new Error("Pass an error or null as first argument to done");

      if (typeof callback !== "function")
        throw new Error("Pass a callback to done");

      renames(blogID, async function (err) {
        if (err) {
          await release();
          return callback(err);
        }

        // What is the appropriate order for this?
        buildFromFolder(blogID, async function (err) {
          if (err) {
            await release();
            return callback(err);
          }

          const cacheID = Date.now();

          // Passing in cacheID manually busts the cache.
          // Since Blog.set and Blog.flushCache depend on each other
          // we can't put this there. Ideally we would expose a single function to
          // wipe the cache. So fix that eventually...
          Blog.set(blogID, { cacheID }, async function (err) {
            if (err) {
              await release();
              return callback(err);
            }

            // We could do these next two things in parallel
            // but it's a little bit of refactoring...
            await release();

            folder.log("Finished sync");
            callback(syncError);
          });
        });
      });
    });
  });
}

module.exports = sync;
