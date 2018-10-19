var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var debug = require("debug")("sync:update");

var Template = require("template");

var drop = require("./drop");
var set = require("./set");
var mkdir = require("./mkdir");

module.exports = function(blog) {
  function update(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    debug(blog.id, path);

    // Blot likes leading slashes, the git client
    // for instance does not have them but we
    // are not so strict above these things...
    if (path[0] !== "/") path = "/" + path;

    function done(err) {
      var templateFolder;
      var TemplateFolderRegex = /^(\/templates\/[^\n\r\/]+)\//gi;

      debug(blog.id, path, "complete", err);

      // we never let this error escape out
      if (err) {
        console.error("Blog", blog.id, "Caught error updating", path, err);
      }

      // nor this one
      try {
        templateFolder = path.match(TemplateFolderRegex)[0];
        debug("Template folder:", templateFolder);
      } catch (err) {
        debug(err);
      }

      // The change was not inside the folder for a template
      // so we are done here!
      if (!templateFolder) return callback(null, { error: err || null });

      // Since the change (update, remove) affected the folder
      // for a template, we need to reload the template from disk
      Template.read(blog.id, localPath(blog.id, templateFolder), function(err) {
        if (err) {
          console.error(
            "Blog",
            blog.id,
            "Caught error reading template",
            templateFolder,
            err
          );
        }

        callback(null, { error: err || null });
      });
    }

    fs.stat(localPath(blog.id, path), function(err, stat) {
      if (err && err.code === "ENOENT") {
        // A file might be updated then deleted during a single sync
        // so if we add it to one list we must remove it from the other
        update.deleted.push(path);
        update.modified = update.modified.filter(function(x) {
          return x !== path;
        });

        drop(blog.id, path, options, done);
      } else if (stat && stat.isDirectory()) {
        mkdir(blog.id, path, options, done);
      } else if (stat && stat.isFile()) {
        // A file might be updated then deleted during a single sync
        // so if we add it to one list we must remove it from the other
        update.deleted = update.deleted.filter(function(x) {
          return x !== path;
        });
        update.modified.push(path);
        set(blog, path, options, done);
      } else {
        done(
          new Error(
            [
              "Not sure what to do with" + path,
              "Stat: " + stat,
              "Error: " + err
            ].join("\n")
          )
        );
      }
    });
  }

  update.deleted = [];
  update.modified = [];

  return update;
};
