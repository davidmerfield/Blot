// Generate demonstration blogs from the folders inside
// for showing templates and explaining how Blot works
// in the docs. This script will create a blog for each
// folder e.g. one 'bjorn' for folders/bjorn

// 1. Create admin user if none exists
// 2. Create blogs against admin user assuming the
//    handle is not taken.
// 3. Configure each blog with the local client
//    pointing to the source folder. Local client will
//    watch source folder so changes should appear.

var fs = require("fs-extra");
var async = require("async");
var config = require("config");
var User = require("user");
var Blog = require("blog");
var basename = require("path").basename;
var localClient = require("../clients/local");

function main(options, callback) {
  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  loadFoldersToBuild(__dirname, function(err, folders) {
    if (err) return callback(err);

    if (options.filter) folders = folders.filter(options.filter);

    console.log("Loaded folders from", __dirname);
    setupUser(function(err, user) {
      if (err) return callback(err);

      console.log(
        "Established user " + user.email + " to manage demonstration blogs"
      );
      setupBlogs(user, folders, function(err) {
        if (err) return callback(err);

        console.log("Built " + folders.length + " blogs");
        folders.forEach(function(folder) {
          console.log("http://" + basename(folder) + "." + config.host);
          console.log("Source folder:", folder);
        });

        callback(null);
      });
    });
  });
}

function setupUser(callback) {
  User.getByEmail(config.admin.email, function(err, user) {
    if (err) return callback(err);

    if (user) return callback(null, user);

    User.create(config.admin.email, config.session.secret, {}, callback);
  });
}

function setupBlogs(user, folders, callback) {
  var blogs = {};

  async.eachSeries(
    folders,
    function(path, next) {
      var handle = basename(path);
      Blog.get({ handle: handle }, function(err, existingBlog) {
        if (err) return next(err);

        if (existingBlog && existingBlog.owner !== user.uid)
          return next(
            new Error(existingBlog.handle + " owned by another user")
          );

        if (existingBlog) {
          blogs[existingBlog.id] = path;
          return next();
        }

        Blog.create(user.uid, { handle: handle }, function(err, newBlog) {
          blogs[newBlog.id] = path;
          next();
        });
      });
    },
    function(err) {
      if (err) return callback(err);
      async.eachOfSeries(
        blogs,
        function(path, id, next) {
          localClient.setup(id, path, function(err) {
            if (err) return next(err);

            if (config.environment !== "development") {
              localClient.disconnect(id, next);
            } else {
              next();
            }
          });
        },
        callback
      );
    }
  );
}

function loadFoldersToBuild(foldersDirectory, callback) {
  fs.readdir(foldersDirectory, function(err, folders) {
    if (err) return callback(err);

    folders = folders
      .map(function(name) {
        return foldersDirectory + "/" + name;
      })
      .filter(function(path) {
        return basename(path)[0] !== "-" && fs.statSync(path).isDirectory();
      });

    callback(null, folders);
  });
}

if (require.main === module) {
  var options = {};

  if (process.argv[2])
    options.filter = function(path) {
      return path.indexOf(process.argv[2]) > -1;
    };

  main(options, function(err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
