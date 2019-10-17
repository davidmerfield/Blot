var helper = require("helper");
var ensure = helper.ensure;
var blogDir = helper.blogDir;
var fs = require("fs-extra");
var readFromFolder = require("./readFromFolder");
var async = require("async");

module.exports = function(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var templateDirs = [
    blogDir + "/" + blogID + "/templates",
    blogDir + "/" + blogID + "/Templates"
  ];

  async.eachSeries(
    templateDirs,
    function(templateDir, next) {
      fs.readdir(templateDir, function(err, templates) {
        if (err || !templates) return next();

        async.eachSeries(
          templates,
          function(template, next) {
            // Dotfile
            if (template.charAt(0) === ".") return next();

            var dir = templateDir + "/" + template;

            readFromFolder(blogID, dir, function(err) {
              if (err) {
                // we need to expose this error
                // on the design page!
              }

              next();
            });
          },
          next
        );
      });
    },
    function(err) {
      var cacheID = Date.now();
      require("blog").set(
        blogID,
        {
          cssURL: "/style.css?" + cacheID,
          scriptURL: "/script.js?" + cacheID
        },
        callback
      );
    }
  );
};
