var get = require("../get/blog");
var Blog = require("models/blog");

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  Blog.set(blog.id, { isDisabled: true }, function (err) {
    if (err) throw err;

    console.log("Disabled", blog.handle, blog.id);
    process.exit();
  });
});
