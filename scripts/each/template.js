var eachBlog = require("./blog");
var Template = require("models/template");
var async = require("async");
var config = require("../../config");

module.exports = function (doThis, callback) {
  eachBlog(function (user, blog, nextBlog) {
    Template.getTemplateList(blog.id, function (err, templates) {
      if (err) throw err;

      async.eachSeries(
        templates,
        function (template, nextTemplate) {
          // Only manipulate templates owned by the blog
          if (template.owner !== blog.id) return nextTemplate();

          // console.log();
          // console.log(
          //   blog.id + ".",
          //   template.slug,
          //   "(" + blog.handle + ")",
          //   "http://preview.my." +
          //     template.slug +
          //     "." +
          //     blog.handle +
          //     "." +
          //     config.host
          // );
          // console.log("----------------------------------------------------");

          doThis(user, blog, template, nextTemplate);
        },
        nextBlog
      );
    });
  }, callback);
};
