var async = require("async");
var Entry = require("entry");
var client = require("client");
var Blog = require("blog");
var build = require("../../build");
var Metadata = require("metadata");

var dependentsKey = Entry.key.dependents;

// The purpose of this module is to rebuild any
// entries already in the user's folder which depend
// on the contents of this particular file which was
// just changed or removed.

module.exports = function(blogID, path, callback) {
  Blog.get({ id: blogID }, function(err, blog) {
    client.SMEMBERS(dependentsKey(blogID, path), function(
      err,
      dependent_paths
    ) {
      if (err) return callback(err);

      async.eachSeries(
        dependent_paths,
        function(dependent_path, next) {
          var options = {};

          Metadata.get(blogID, dependent_path, function(err, name) {
            if (err) {
              console.log("Error rebuilding dependents:", path, err);
              return next();
            }

            if (name) options.name = name;

            build(blog, dependent_path, options, function(
              err,
              updated_dependent
            ) {
              if (err) {
                console.log("Error rebuilding dependents:", path, err);
                return next();
              }

              Entry.set(
                blogID,
                dependent_path,
                updated_dependent,
                function(err) {
                  if (err) return callback(err);

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
