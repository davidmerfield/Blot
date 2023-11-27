const each = require("../each/blog");
const ensure = require("helper/ensure");
const Blog = require("models/blog");
const defaultPlugins = require("build/plugins").defaultList;

each(
  (user, blog, next) => {
    if (!blog || blog.isDisabled) return next();

    if (!blog.flags) {
      blog.flags = {
        google_drive_beta: false
      };
    }

    if (blog.redirectSubdomain === undefined) {
      blog.redirectSubdomain = false;
    }

    if (blog.permalink.isCustom === undefined) {
      blog.permalink.isCustom =
        blog.permalink.custom !== undefined && blog.permalink.custom !== "";
    }

    if (blog.new_dashboard) delete blog.new_dashboard;
    if (blog.new_markdown_renderer) delete blog.new_markdown_renderer;
    if (blog.dateDisplay) delete blog.dateDisplay;
    if (blog.hideDates) delete blog.hideDates;

    Object.keys(defaultPlugins).forEach(plugin => {
      if (blog.plugins[plugin] === undefined) {
        blog.plugins[plugin] = defaultPlugins[plugin];
        console.log("Adding plugin", plugin, "to", blog.id);
      }
    });

    ensure(blog, Blog.scheme.TYPE, true);
    Blog.set(blog.id, blog, next);
  },
  err => {
    if (err) throw err;
    console.log("All blogs processed!");
    process.exit();
  }
);
