var ensure = require("helper/ensure");
var localPath = require("helper/localPath");
var fs = require("fs-extra");
var readFromFolder = require("./readFromFolder");
var async = require("async");

module.exports = function (blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var templateDirs = [
    localPath(blogID, "/templates"),
    localPath(blogID, "/Templates"),
  ];

  async.eachSeries(
    templateDirs,
    function (templateDir, next) {
      fs.readdir(templateDir, function (err, templates) {
        if (err || !templates) return next();

        async.eachSeries(
          templates,
          function (template, next) {
            // Dotfile
            if (template.charAt(0) === ".") return next();

            var dir = templateDir + "/" + template;

            readFromFolder(blogID, dir, function (err) {
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
    callback
  );
};
