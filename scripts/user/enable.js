var User = require("models/user");
var Blog = require("models/blog");
var get = require("../get/user");
var async = require("async");

var handle = process.argv[2];

if (!handle) throw "Please pass the user's handle as an argument.";

get(handle, function (err, user) {
  if (err || !user) throw err || "No user";

  async.each(
    user.blogs,
    function (blogID, nextBlog) {
      Blog.set(blogID, { isDisabled: false }, nextBlog);
    },
    function () {
      User.set(user.uid, { isDisabled: false }, function (err) {
        if (err) throw err;

        console.log(
          user.email + "'s blot account (" + user.uid + ") has been enabled"
        );
        process.exit();
      });
    }
  );
});
