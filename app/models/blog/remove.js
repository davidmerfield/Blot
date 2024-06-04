var async = require("async");
var client = require("models/client");
var config = require("config");
var fs = require("fs-extra");
var get = require("./get");
var set = require("./set");
var key = require("./key");
var BackupDomain = require("./util/backupDomain");
var flushCache = require("./flushCache");

var START_CURSOR = "0";
var SCAN_SIZE = 1000;

function remove(blogID, callback) {
  get({ id: blogID }, function (err, blog) {
    if (err || !blog) return callback(err || new Error("No blog"));

    // We need to enable the blog to disconnect the client
    // since we need to acquire a sync lock...
    set(blog.id, { isDisabled: false }, function (err) {
      if (err) return callback(err);

      flushCache(blogID, function (err) {
        if (err) return callback(err);

        // The order of these tasks is important right now.
        // For example, if you wipe the blog's folder before disconnecting
        // the client, you might run into an error. It would be nice to
        // be able to run them in parallel though
        var tasks = [disconnectClient, updateUser, wipeFolders, deleteKeys].map(
          function (task) {
            return task.bind(null, blog);
          }
        );

        async.series(tasks, callback);
      });
    });
  });
}

function wipeFolders(blog, callback) {
  if (!blog.id || typeof blog.id !== "string")
    return callback(new Error("Invalid blog id"));

  var blogFolder = config.blog_folder_dir + "/" + blog.id;
  var staticFolder = config.blog_static_files_dir + "/" + blog.id;

  async.parallel(
    [
      safelyRemove.bind(null, blogFolder, config.blog_folder_dir),
      safelyRemove.bind(null, staticFolder, config.blog_static_files_dir),
    ],
    callback
  );

  // This could get messy if the blog.id is an empty
  // string or if it somehow resolves to the blog folder
  // so we do a few more steps to ensure we're only ever deleting
  // a folder inside the particular directory and nothing else
  function safelyRemove(folder, root, callback) {
    fs.realpath(folder, function (err, realpathToFolder) {
      // This folder does not exist, so no need to do anything
      if (err && err.code === "ENOENT") return callback();

      if (err) return callback(err);

      fs.realpath(root, function (err, realpathToRoot) {
        if (err) return callback(err);

        if (realpathToFolder.indexOf(realpathToRoot + "/") !== 0)
          return callback(
            new Error("Could not safely remove directory:" + folder)
          );

        fs.remove(realpathToFolder, callback);
      });
    });
  }
}

function deleteKeys(blog, callback) {
  var multi = client.multi();

  var patterns = ["template:" + blog.id + ":*", "blog:" + blog.id + ":*"];

  var remove = ["template:owned_by:" + blog.id, "handle:" + blog.handle];

  // TODO ALSO remove alternate key with/out 'www', e.g. www.example.com
  if (blog.domain) {
    remove.push("domain:" + blog.domain);
    remove.push("domain:" + BackupDomain(blog.domain));
  }

  remove.push("domain:" + blog.handle + "." + config.host);

  async.each(
    patterns,
    function (pattern, next) {
      var args = [START_CURSOR, "MATCH", pattern, "COUNT", SCAN_SIZE];

      client.scan(args, function then(err, res) {
        if (err) throw err;

        // the cursor for the next pass
        args[0] = res[0];

        // Append the keys we matched in the last pass
        remove = remove.concat(res[1]);

        // There are more keys to check, so keep going
        if (res[0] !== START_CURSOR) return client.scan(args, then);

        next();
      });
    },
    function () {
      multi.del(remove);
      multi.srem(key.ids, blog.id);
      multi.exec(callback);
    }
  );
}

function disconnectClient(blog, callback) {
  var clients = require("clients");

  if (!blog.client || !clients[blog.client]) return callback(null);

  clients[blog.client].disconnect(blog.id, function(err){

    // we still want to continue even if there is an error
    if (err) {
      console.error('Error disconnecting client:', err);
    }

    callback(null);
  });
}

function updateUser(blog, callback) {
  var User = require("models/user");
  User.getById(blog.owner, function (err, user) {
    if (err) return callback(err);

    // If the user has already been deleted then
    // we don't need to worry about this.
    if (!user || !user.blogs) {
      return callback();
    }

    var changes = {};

    var blogs = user.blogs.slice();

    blogs = blogs.filter(function (otherBlogID) {
      return otherBlogID !== blog.id;
    });

    changes.blogs = blogs;

    if (user.lastSession === blog.id) changes.lastSession = "";

    User.set(blog.owner, changes, callback);
  });
}

module.exports = remove;
