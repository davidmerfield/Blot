var eachBlog = require("../each/blog");
var templates = {};
var Template = require("../../app/models/template");
var async = require("async");

eachBlog(
  function(user, blog, next) {
    templates[blog.template] = templates[blog.template] || 0;
    templates[blog.template]++;
    next();
  },
  function() {
    var res = Object.keys(templates)
      .map(function(templateID) {
        return { id: templateID, count: templates[templateID] };
      })
      .sort(function(a, b) {
        return b.count - a.count;
      })
      .map(function(item){
        return item.id;
      })
      .slice(0, 10);


    async.map(res, Template.get, function(err, res) {
      console.log("Top 10 templates:");
      res.forEach(function(template, i) {
        console.log(++i + ". " + template.name, "(" + templates[template.id] + ")");
      });
      process.exit();
    });
  }
);
