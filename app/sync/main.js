const buildFromFolder = require("models/template").buildFromFolder;
const Blog = require("models/blog");
const Update = require("./update");
const Rename = require("./rename");
const localPath = require("helper/localPath");
const renames = require("./renames");
const type = require("helper/type");
const messenger = require("./messenger");
const clients = require("clients");

function sync (blogID, callback) {
  if (!type(callback, "function")) {
    throw new TypeError(
      "Expected callback with type:Function as second argument"
    );
  }

  if (!type(blogID, "string")) {
    return callback(
      new TypeError("Expected blogID with type:String as first argument")
    );
  }

  Blog.get({ id: blogID }, async function (err, blog) {
    // It would be nice to get an error from Blog.get instead of this...
    if (err || !blog || !blog.id || blog.isDisabled) {
      const message = "Cannot sync blog " + blogID;
      const error = new Error(message);
      console.log(error);
      return callback(error);
    }

    const { log, status } = messenger(blog);

    log("Starting sync");

    const folder = {
      path: localPath(blogID, "/"),
      update: new Update(blog, log, status),
      rename: Rename(blog, log),
      status,
      log
    };

    // Right now localPath returns a path with a trailing slash for some
    // crazy reason. This means that we need to remove the trailing
    // slash for this to work properly. In future, you should be able
    // to remove this line when localPath works properly.
    if (folder.path.slice(-1) === "/") folder.path = folder.path.slice(0, -1);

    // We acquired a lock on the resource!
    // This function is to be called when we are finished
    // with the lock on the user's folder.
    folder.status("Syncing");

    clients[blog.client].sync(folder, function (err) {
      if (err) {
        log("Error syncing");
        return callback(err);
      }

      folder.status("Synced");

      log("Checking for renamed files");
      renames(blogID, function (err) {
        if (err) {
          log("Error checking file renames");
          return callback(err);
        }

        // What is the appropriate order for this?
        log("Building templates from folder");
        buildFromFolder(blogID, async function (err) {
          if (err) {
            log("Error building templates from folder");
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
              return callback(err);
            }

            log("Finished sync");
            callback();
          });
        });
      });
    });
  });
}

module.exports = sync;
