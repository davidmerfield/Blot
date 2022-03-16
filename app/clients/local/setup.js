const Sync = require("sync");
const Blog = require("models/blog");
const async = require("async");
const config = require("config");
const chokidar = require("chokidar");
const localPath = require("helper/localPath");

let watchers = {};

function setup(blogID, callback) {
  console.log("Setting up local client for", blogID);
  // debug("Synchronizing source folder with Blot");
  // Fix(blogID, function (err) {
  // console.log("Setup complete");
  // });
  if (config.environment === "development") {
    watch(blogID);
  }
  callback();
}

function watch(blogID) {
  // We want to queue up and process in order
  // events from the file system.
  const queue = async.queue(function (path, callback) {
    Blog.get({ id: blogID }, function (err, blog) {
      if (blog.client !== "local") {
        console.log("Tearing down local client for", blogID);
        watchers[blogID].close();
        delete watchers[blogID];
        return callback();
      }

      Sync(blogID, function (err, folder, done) {
        if (err) {
          console.log(err);
          return callback();
        }
        folder.update(path, function (err) {
          done(err, function (err) {
            if (err) return callback(err);
            callback();
          });
        });
      });
    });
  });

  try {
    if (watchers[blogID]) return;

    // To stop this watcher, call watcher.close();
    const watcher = chokidar.watch(localPath(blogID, "/"), {
      cwd: localPath(blogID, "/"),
    });

    watcher.on("all", (event, path) => {
      if (!path) return;
      // Blot likes leading slashes
      path = "/" + path;
      queue.push(path);
    });

    watchers[blogID] = watcher;
  } catch (e) {
    return console.error(e);
  }
}

module.exports = setup;
