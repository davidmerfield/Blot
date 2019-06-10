var fs = require("fs");
var basename = require("path").basename;
var mime = require("mime");
var async = require("async");
var makeID = require("./util/makeID");
var isOwner = require("./isOwner");
var setView = require("./setView");
var MAX_SIZE = 2.5 * 1000 * 1000; // 2.5mb
var PACKAGE = "package.json";

module.exports = function readFromFolder(blogID, dir, callback) {
  var id = makeID(blogID, basename(dir));

  isOwner(blogID, id, function(err, isOwner) {
    if (err) return callback(err);

    if (!isOwner) return callback(badPermission(blogID, id));

    fs.readdir(dir, function(err, contents) {
      if (err) return callback(err);

      async.eachSeries(
        contents,
        function(name, next) {
          // Skip Dotfile or Package.json
          if (name[0] === "." || name === PACKAGE) return next();

          fs.stat(dir + "/" + name, function(err, stat) {
            // Skip folders, or files which are too large
            if (err || !stat || stat.size > MAX_SIZE || stat.isDirectory())
              return next();

            fs.readFile(dir + "/" + name, "utf-8", function(err, content) {
              if (err) return next();

              var view = {
                name: name,
                content: content
              };

              setView(id, view, function(err) {
                if (err) return next();

                next();
              });
            });
          });
        },
        callback
      );
    });
  });
};

function badPermission(blogID, templateID) {
  return new Error("No permission for " + blogID + " to write " + templateID);
}
