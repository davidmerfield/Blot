var fs = require("fs-extra");
var Sync = require("sync");
var Folder = require("clients/local/models/folder");
var async = require("async");
var debug = require("debug")("blot:clients:local:setup");
var watch = require("./watch");
var walk = require("./util/walk");
var hash = require("./util/hash");
var config = require("config");
var client = require("redis").createClient();
var clfdate = require("helper/clfdate");

// This communication channel allows us to load in and out
// new blogs in external scripts. We send a message to this
// channel in scripts/load/info.js
var CHANNEL = "clients:local:new-folder";
console.log(clfdate(), "Listening for new local folder clients");
client.subscribe(CHANNEL);
client.on("message", function (channel, message) {
  debug("recieved", message, "on", channel);
  if (channel !== CHANNEL) return;
  let { blogID, folder } = JSON.parse(message);
  setup(blogID, folder, function (err) {
    if (err) console.error(err);
  });
});

// Start listening for all blogs with this client
if (config.environment === "development") {
  Folder.list(function (err, blogIDs) {
    if (err) console.error(err);
    blogIDs.forEach(init);
  });
}

function init(blogID) {
  console.log(clfdate(), "Blog:", blogID, "Setting up local client");
  Folder.get(blogID, function (err, folder) {
    if (err) console.error(err);
    if (!folder) return;
    if (!fs.existsSync(folder)) return;

    console.log(clfdate(), "Blog:", blogID, "Watching", folder);
    watch(blogID, folder);

    console.log(clfdate(), "Blog:", blogID, "Synchronizing", folder);
    synchronize(blogID, folder, function (err) {
      if (err) console.error(err);
      console.log(clfdate(), "Blog:", blogID, "Set up local client");
    });
  });
}
function setup(blogID, folder, callback) {
  console.log("Setting up local client in", folder);
  fs.ensureDir(folder, function (err) {
    if (err) return callback(err);
    debug("Storing folder for", blogID, "in database");
    Folder.set(blogID, folder, function (err) {
      if (err) return callback(err);
      debug("Synchronizing source folder with Blot");
      synchronize(blogID, folder, function (err) {
        if (err) return callback(err);

        if (config.environment === "development") {
          debug("Watching source folder for changes");
          watch(blogID, folder);
        }

        console.log("Setup complete");
        callback();
      });
    });
  });
}

// Used to syncrhonize the source folder with Blot
// when the local client is first connected to a blog.
// It walks the source folder and Blot's folder for the
// blog and compares the two, if anything is out of sync
// the changes from the source folder are applied.
function synchronize(blogID, sourceFolder, callback) {
  // We build up two hashes of MD5 digests against
  // paths inside the source folder, e.g. ~/Blog and
  // Blot's folder, e.g. /var/www/blot/blogs/$BLOG_ID
  var sourceFolderTree = {};
  var blotFolderTree = {};
  var updatedPaths = [];

  // We don't want to make any changes to the folder in
  // a way which might conflict with other processes
  // so we acquire a lock on the blog's folder on Blot.
  Sync(blogID, {}, function (err, folder, done) {
    if (err) return callback(err);

    try {
      walk(sourceFolder).forEach(function (path) {
        sourceFolderTree[path.slice(sourceFolder.length)] = hash(path);
      });

      walk(folder.path).forEach(function (path) {
        blotFolderTree[path.slice(folder.path.length)] = hash(path);
      });
    } catch (e) {
      return callback(e);
    }

    // We remove any paths in /blot/blogs/$blog_id which no
    // longer exist in the source folder.
    for (var path in blotFolderTree) {
      if (sourceFolderTree[path] === undefined) {
        fs.removeSync(folder.path + path);
        updatedPaths.push(path);
      }
    }

    // We copy any files from the source folder if the version
    // in /blot/blogs/$blog_id does not match or does not exist.
    for (path in sourceFolderTree) {
      if (sourceFolderTree[path] !== blotFolderTree[path]) {
        fs.copySync(sourceFolder + path, folder.path + path);
        updatedPaths.push(path);
      }
    }

    // We tell Blot to update what it has stored in its database
    // about the files or folders at the paths we modified.
    async.each(updatedPaths, folder.update, function (err) {
      done(err, callback);
    });
  });
}

module.exports = setup;
