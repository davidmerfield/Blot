var helper = require("helper");
var ensure = helper.ensure;
var extend = helper.extend;
var defaults = require("./defaults");
var client = require("client");
var key = require("./key");
var set = require("./set");
var fs = require("fs-extra");
var localPath = helper.localPath;
var User = require("../user");
var validate = require("./validate");
var generateID = require("./generateID");

module.exports = function create(uid, info, callback) {
  ensure(uid, "string")
    .and(info, "object")
    .and(callback, "function");

  var blogs;
  var title;

  // Determine a title for the new blog. Falls
  // back to the handle then a placeholder
  if (info.title) {
    title = info.title;
  } else if (info.handle) {
    title = info.handle;
  } else {
    title = "Untitled blog";
  }

  var blog = {
    owner: uid,
    title: title,
    client: "",
    timeZone: info.timeZone || "UTC",
    dateFormat: info.dateFormat || "M/D/YYYY"
  };

  extend(blog)
    .and(info)
    .and(defaults);

  validate("", blog, function(errors) {
    if (errors) return callback(errors);

    User.getById(uid, function(err, user) {
      if (err || !user) return callback(err || new Error("No user"));

      blog.id = generateID();
      blogs = user.blogs || [];
      blogs.push(blog.id);

      User.set(uid, { blogs: blogs, lastSession: blog.id }, function(err) {
        if (err) return callback(err);

        client.sadd(key.ids, blog.id, function(err) {
          if (err) return callback(err);

          set(blog.id, blog, function(err) {
            if (err) return callback(err);

            fs.emptyDir(localPath(blog.id, "/"), function(err) {
              if (err) return callback(err);

              return callback(err, blog);
            });
          });
        });
      });
    });
  });
};
