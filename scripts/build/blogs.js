var fs = require("fs-extra");
var async = require("async");
var config = require("../../config");
var foldersDirectory = __dirname + "/../../app/folders";
var User = require("../../app/models/user");
var Blog = require("../../app/models/blog");
var LocalClient = require("../../app/clients/local");

var folders;

// E.g. ['bjorn'] from the folders in /app/folders
folders = fs.readdirSync(foldersDirectory).filter(function(folder) {
  return fs.statSync(foldersDirectory + "/" + folder).isDirectory();
});

if (require.main === module && process.argv.slice(2).length) {
  folders = folders.filter(function(folder) {
    return process.argv.slice(2).indexOf(folder) > -1;
  });

  if (!folders.length) throw new Error('No folders to build matching "' + process.argv.slice(2) + '"');
}

setupUser(function(err, user) {
  if (err) throw err;

  setupBlogs(user, folders, function(err, blogs) {
    if (err) throw err;

    async.eachSeries(
      blogs,
      function(blog, next) {
        console.log('Building', blog.handle);
        LocalClient.setup(
          blog.id,
          foldersDirectory + "/" + blog.handle,
          function(err) {
            if (err) return next(err);

            LocalClient.disconnect(blog.id, next);
          }
        );
      },
      function() {
        console.log("Built all", folders.length, "demonstration blogs");

        folders.forEach(function(folder) {
          console.log("- http://" + folder + "." + config.host);
        });

        process.exit();
      }
    );
  });
});

function setupUser(callback) {
  // Create user and blogs for each demo folder
  User.create(config.admin.email, "", {}, function(err) {
    if (err && err.code !== "EEXISTS") return callback(err);

    User.getByEmail(config.admin.email, callback);
  });
}

function setupBlogs(user, handles, callback) {
  async.map(
    handles,
    function(handle, next) {
      Blog.create(user.uid, { handle: handle }, function(err, blog) {
        if (!err && blog) return next(err, blog);

        if (err && err.handle && err.handle.code !== "EEXISTS")
          return next(err);

        Blog.get({ handle: handle }, function(err, blog) {
          if (err) return next(err);

          if (blog.owner === user.uid) return next(err, blog);

          next(
            new Error(
              "Blog: " +
                handle +
                " already exists and it is not owned by " +
                user.email
            )
          );
        });
      });
    },
    callback
  );
}
