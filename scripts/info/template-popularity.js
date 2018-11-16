var eachBlog = require("../each/blog");

var templates = {};

eachBlog(
  function(user, blog, next) {
    templates[blog.template] = templates[blog.template] || 0;
    templates[blog.template]++;

    next();
  },
  function() {
    console.log(
      Object.keys(templates)
        .map(function(name) {
          return { count: templates[name], name: name };
        })
        .sort(function(a, b) {
          return b.count - a.count;
        })
        .slice(0, 10)
    );

    process.exit();
  }
);
