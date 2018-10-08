var basename = require("path").basename;
var mime = require("mime");
var fs = require("fs");

var helper = require("helper");
var ensure = helper.ensure;
var async = require("async");
var setView = require("./setView");
var isOwner = require("./isOwner");
var makeID = require("./makeID");
var MAX_SIZE = 2.5 * 1000 * 1000; // 2.5mb
var PACKAGE = "package.json";

module.exports = function readFromFolder(blogID, dir, callback) {
  ensure(blogID, "string")
    .and(dir, "string")
    .and(callback, "function");

  var id = makeID(blogID, basename(dir));

  isOwner(blogID, id, function(err, isOwner) {
    if (err) return callback(err);

    if (!isOwner) return callback(badPermission(blogID, id));

    fs.readdir(dir, function(err, contents) {
      if (err) return callback(err);

      async.eachSeries(
        contents,
        function(name, next) {
          // Dotfile
          if (name[0] === ".") return next();

          // Package.json
          if (name === PACKAGE) return next();

          fs.stat(dir + "/" + name, function(err, stat) {
            if (err) return next();

            if (stat.size > MAX_SIZE) return next();

            fs.readFile(dir + "/" + name, "utf-8", function(err, content) {
              if (err && err.code === "ENOENT") return next();

              // this is a directory
              if (err && err.code === "EISDIR") return next();

              if (err) {
                console.log(err);
                return next();
              }

              var view = {
                name: nameFrom(name),
                type: mime.lookup(name),
                content: content
              };

              setView(id, view, next);
            });
          });
        },
        callback
      );
    });
  });
};

function nameFrom(str) {
  var name = str;

  if (name.indexOf(".") > -1) name = name.slice(0, name.lastIndexOf("."));

  if (name[0] === "_") name = name.slice(1);

  return name;
}

function badPermission(blogID, templateID) {
  return new Error("No permission for " + blogID + " to write " + templateID);
}
