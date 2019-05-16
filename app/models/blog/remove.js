var async = require("async");
var client = require("client");
var config = require("config");
var fs = require("fs-extra");

var get = require("./get");
var key = require("./key");
var symlinks = require("./symlinks");
var BackupDomain = require("./util/backupDomain");

var START_CURSOR = "0";
var SCAN_SIZE = 1000;

function remove(blogID, callback) {
  get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    var tasks = [
      wipeFolders,
      updateUser,
      disconnectClient,
      removeSymlinks,
      deleteKeys
    ].map(function(task) {
      return task.bind(null, blog);
    });

    async.series(tasks, callback);
  });
}

function wipeFolders(blog, callback) {
  fs.remove(config.blog_folder_dir + "/" + blog.id, function(err) {
    if (err) return callback(err);
    fs.remove(config.blog_static_files_dir + "/" + blog.id, callback);
  });
}

function removeSymlinks(blog, callback) {
  var symlinksToRemove = [];

  if (blog.domain) {
    symlinksToRemove.push(blog.domain);
    symlinksToRemove.push(BackupDomain(blog.domain));
  }

  if (blog.handle) {
    symlinksToRemove.push(blog.handle + "." + config.host);
  }

  symlinks(blog.id, [], symlinksToRemove, callback);
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

  async.each(
    patterns,
    function(pattern, next) {
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
    function() {
      multi.del(remove);
      multi.srem(key.ids, blog.id);
      multi.exec(callback);
    }
  );
}

function disconnectClient(blog, callback) {
  var clients = require("clients");

  if (!blog.client || !clients[blog.client]) return callback(null);

  clients[blog.client].disconnect();
}

function updateUser(blog, callback) {
  var User = require("user");
  User.getById(blog.owner, function(err, user) {
    if (err) return callback(err);

    var blogs = user.blogs.slice();

    blogs = blogs.filter(function(otherBlogID) {
      return otherBlogID !== blog.id;
    });

    User.set(blog.owner, { blogs: blogs }, callback);
  });
}

module.exports = remove;
