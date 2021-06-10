var each = require("../each/blog");
var Blog = require("models/blog");

each(
  function (user, blog, next) {
    Blog.set(blog.id, blog, next);
  },
  function (err) {
    if (err) throw err;
    console.log("resaved all blogs");
    process.exit();
  }
);
