// This script generates demonstration blogs from the
// folders inside app/folders. These blogs are useful
// for showing templates and explaining how Blot works
// in the docs. This script will create a blog for each
// folder e.g. one with the username 'bjorn' for
// app/folders/bjorn

// 1. Create admin user if none exists
// 2. Create blogs against admin user assuming the
//    handle is not taken.
// 3. Configure each blog with the local client
//    pointing to the source folder. Local client will
//    watch source folder so changes should appear.

// How to store links in the menu? How to encode an avatar?
// This will be useful food for thought when we allow people
// to edit their blog's settings from the folder, e.g.
// a .blot directory containing config...

var fs = require("fs-extra");
var async = require("async");
var colors = require("colors/safe");
var helper = require("../../app/helper");
var config = require("../../config");
var User = require("../../app/models/user");
var Blog = require("../../app/models/blog");
var localClient = require("../../app/clients/local");
var logInLink = require("../access");

// Now we search the source code to work out which blogs to create
var foldersDirectory = helper.rootDir + "/app/folders";
var blogs = fs
  .readdirSync(foldersDirectory)
  .map(function(handle) {
    return { handle: handle, path: foldersDirectory + "/" + handle };
  })
  .filter(function(blog) {
    return fs.statSync(blog.path).isDirectory();
  });

setupUser(function(err, user) {
  if (err) throw err;
  setupBlogs(user, blogs, function(err) {
    if (err) throw err;
    logInLink(blogs[0].handle, function(err, link) {
      if (err) throw err;

      console.log();
      console.log("Blogs setup! Log in to the dashboard:");
      console.log(link);

      blogs.forEach(function(blog) {
        console.log();
        console.log("http://" + blog.handle + "." + config.host);
        console.log(colors.dim("Source folder:"), blog.path);
      });

      console.log();
      process.exit();
    });
  });
});

function setupUser(callback) {
  User.getByEmail(config.admin.email, function(err, user) {
    if (user) return callback(null, user);

    callback(
      new Error(
        "Please create a user to own the blogs. Use the email: " +
          config.admin.email
      )
    );
  });
}

function setupBlogs(user, blogs, callback) {
  async.eachSeries(
    blogs,
    function(blog, next) {
      var handle = blog.handle;

      Blog.get({ handle: handle }, function(err, existingBlog) {
        if (err) return next(err);

        if (existingBlog && existingBlog.owner !== user.uid)
          return next(
            new Error("Blog: " + blog.handle + " is owned by another user")
          );

        if (existingBlog) {
          blog.id = existingBlog.id;
          return next();
        }

        Blog.create(user.uid, { handle: handle }, function(err, newBlog) {
          blog.id = newBlog.id;
          next();
        });
      });
    },
    function(err) {
      if (err) return callback(err);
      async.eachSeries(
        blogs,
        function(blog, next) {
          localClient.setup(blog.id, blog.path, next);
        },
        callback
      );
    }
  );
}
