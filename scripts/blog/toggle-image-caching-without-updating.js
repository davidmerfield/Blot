var get = require("../get/blog");
var Blog = require("models/blog");

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  let { plugins } = blog;

  plugins.image.enabled = !plugins.image.enabled;

  Blog.set(blog.id, { plugins }, function (err) {
    if (err) throw err;

    if (plugins.image.enabled) {
      console.log("Enabled image caching for", blog.handle, blog.id);
    } else {
      console.log("Disabled image caching for", blog.handle, blog.id);
    }

    process.exit();
  });
});
