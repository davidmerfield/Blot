const each = require("../each/blog");
const ensure = require("helper/ensure");
const Blog = require("models/blog");

each(
  (user, blog, next) => {
    if (!blog.flags) {
      blog.flags = {
        google_drive_beta: false,
      };
    }

    if (blog.new_dashboard) delete blog.new_dashboard;
    if (blog.new_markdown_renderer) delete blog.new_markdown_renderer;
    if (blog.dateDisplay) delete blog.dateDisplay;
    if (blog.hideDates) delete blog.hideDates;

    ensure(blog, Blog.scheme.TYPE, true);
    Blog.set(blog.id, blog, next);
  },
  (err) => {
    if (err) throw err;
    console.log("All blogs processed!");
    process.exit();
  }
);
