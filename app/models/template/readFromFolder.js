var fs = require("fs-extra");
var basename = require("path").basename;
var getMetadata = require("./getMetadata");
var setMetadata = require("./setMetadata");
var getView = require("./getView");
var async = require("async");
var makeID = require("./util/makeID");
var isOwner = require("./isOwner");
var setView = require("./setView");
var MAX_SIZE = 2.5 * 1000 * 1000; // 2.5mb
var PACKAGE = "package.json";
var savePackage = require("./package").save;

module.exports = function readFromFolder(blogID, dir, callback) {
  var id = makeID(blogID, basename(dir));

  isOwner(blogID, id, function (err, isOwner) {
    if (err) return callback(err);

    if (!isOwner) return callback(badPermission(blogID, id));

    getMetadata(id, function (err, template) {
      if (!template || template.localEditing !== true)
        return callback(new Error("Not local"));

      fs.readdir(dir, function (err, contents) {
        if (err) return callback(err);

        loadPackage(id, dir, function (err, views) {
          const errors = {};

          if (err) {
            errors["package.json"] = err.message;
          }

          async.eachSeries(
            contents,
            function (name, next) {
              // Skip Dotfile or Package.json
              if (name[0] === "." || name === PACKAGE) return next();

              fs.stat(dir + "/" + name, function (err, stat) {
                // Skip folders, or files which are too large
                if (err || !stat || stat.size > MAX_SIZE || stat.isDirectory())
                  return next();

                fs.readFile(dir + "/" + name, "utf-8", function (err, content) {
                  if (err) return next();

                  // We look up this view file to merge any existing properties
                  // Should this really be handled by setView? It looks like
                  // setView already calls getView...
                  getView(id, name, function (err, view) {
                    // getView returns an error if the view does not exist
                    // We want to be able to create new views using local editing
                    // we so ignore this error, and create the view object as needed
                    view = view || {};
                    view.name = view.name || name;

                    // Views might not exist if there's an error
                    // with the template's package.json file
                    if (views && views[name])
                      for (var i in views[name]) view[i] = views[name][i];

                    view.content = content;
                    view.url = view.url || "/" + view.name;

                    setView(id, view, function (err) {
                      // we expose this error to the developer on
                      // the preview subdomain
                      if (err) {
                        errors[view.name] = err.message;
                      }

                      next();
                    });
                  });
                });
              });
            },
            function (err) {
              if (err) return callback(err);
              setMetadata(id, { errors }, function () {
                getMetadata(id, callback);
              });
            }
          );
        });
      });
    });
  });
};

function loadPackage(id, dir, callback) {
  fs.readFile(dir + "/" + PACKAGE, "utf-8", function (err, contents) {
    // Package.json is optional
    if (err && err.code === "ENOENT") {
      return callback(null, {});
    }

    if (err) {
      return callback(new Error("Invalid package.json file: " + err.code));
    }

    try {
      const metadata = JSON.parse(contents);

      savePackage(id, metadata, callback);
    } catch (err) {
      return callback(err);
    }
  });
}

function badPermission(blogID, templateID) {
  return new Error("No permission for " + blogID + " to write " + templateID);
}
