var async = require("async");
var Entry = require("entry");
var client = require("client");
var Blog = require("blog");
var basename = require("path").basename;
var dependentsKey = Entry.key.dependents;

// The purpose of this module is to rebuild any
// entries already in the user's folder which depend
// on the contents of this particular file which was
// just changed or removed.

const bull = require("bull");
const buildQueue = new bull("build");

module.exports = function (blogID, path, callback) {
  console.log('rebiulding dependents!');
  Blog.get({ id: blogID }, function (err, blog) {
    client.SMEMBERS(dependentsKey(blogID, path), function (
      err,
      dependent_paths
    ) {
      if (err) return callback(err);

      async.eachSeries(
        dependent_paths,
        function (dependent_path, next) {
          Entry.get(blogID, dependent_path, async function (entry) {
            if (err) {
              console.log("Error rebuilding dependents:", path, err);
              return next();
            }

            let options = {};

            if (entry.pathDisplay) {
              options.pathDisplay = entry.pathDisplay;
              options.name = basename(entry.pathDisplay);
            }

            const job = await buildQueue.add({
              blog,
              path: dependent_path,
              options,
            });
            let updated_dependent;

            try {
              updated_dependent = await job.finished();
            } catch (err) {
              console.log("Error rebuilding dependents:", path, err);
              return next();
            }

            Entry.set(
              blogID,
              dependent_path,
              updated_dependent,
              function (err) {
                if (err) return callback(err);

                next();
              },
              false
            );
          });
        },
        callback
      );
    });
  });
};
