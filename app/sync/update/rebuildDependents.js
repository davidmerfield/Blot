var async = require("async");
var Entry = require("entry");
var client = require("client");
var Blog = require("blog");
var build = require("build");
var basename = require("path").basename;
var dependentsKey = Entry.key.dependents;
const clfdate = require("helper/clfdate");

// The purpose of this module is to rebuild any
// entries already in the user's folder which depend
// on the contents of this particular file which was
// just changed or removed.

module.exports = function (blogID, path, callback) {
  const log = function () {
    console.log.apply(null, [
      clfdate(),
      blogID.slice(0, 12),
      "rebuildDependents:",
      path,
      ...arguments,
    ]);
  };
  Blog.get({ id: blogID }, function (err, blog) {
    if (err || !blog) return callback(err || new Error("No blog"));
    client.SMEMBERS(dependentsKey(blogID, path), function (
      err,
      dependent_paths
    ) {
      if (err) return callback(err);

      async.eachSeries(
        dependent_paths,
        function (dependent_path, next) {
          Entry.get(blogID, dependent_path, function (entry) {
            if (!entry) {
              log("No entry for dependent_path:", dependent_path);
              return next();
            }

            let options = {};

            if (entry.pathDisplay) {
              options.pathDisplay = entry.pathDisplay;
              options.name = basename(entry.pathDisplay);
            }

            build(blog, dependent_path, options, function (
              err,
              updated_dependent
            ) {
              if (err) {
                log("Error rebuilding dependent_path:", dependent_path, err);
                return next();
              }

              Entry.set(
                blogID,
                dependent_path,
                updated_dependent,
                function (err) {
                  if (err) log("Error saving dependent_path entry", err);

                  next();
                },
                false
              );
            });
          });
        },
        callback
      );
    });
  });
};
