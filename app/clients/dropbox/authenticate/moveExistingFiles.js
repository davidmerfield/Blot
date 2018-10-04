var sync = require("sync");
var database = require("../database");
var createClient = require("../util/createClient");

module.exports = function(req, res, next) {
  var otherBlog = req.otherBlogUsingEntireAppFolder;

  if (!otherBlog) return next(new Error("No blog to move"));

  var client = createClient(req.unsavedAccount.access_token);

  // Get a lock on the blog to ensure no other changes happen during migration
  // might want to add retries here...
  sync(otherBlog.id, function(err, folder, done) {
    if (err) return next(err);

    determineFolder(otherBlog.title, client, function(
      err,
      entries,
      folder,
      folderID
    ) {
      if (err) return done(err, next);

      move(client, entries, function(err) {
        if (err) return done(err, next);

        database.set(
          otherBlog.id,
          {
            folder: folder,
            folder_id: folderID,
            cursor: ""
          },
          function(err) {
            done(err, next);
          }
        );
      });
    });
  });
};

function determineFolder(title, client, callback) {
  var folder = "/" + (title || "Untitled");
  var folderID;
  var entries;

  client
    .filesListFolder({
      path: "",
      include_deleted: false,
      recursive: false
    })
    .then(function(res) {
      res.entries.forEach(function(entry) {
        if (entry.path_lower === folder.toLowerCase()) folder += " (1)";
      });

      entries = res.entries.map(function(entry) {
        return {
          from_path: entry.path_display,
          to_path: folder + entry.path_display
        };
      });

      return client.filesCreateFolder({ path: folder, autorename: false });
    })
    .then(function(res) {
      folder = res.path_display;
      folderID = res.id;
      callback(null, entries, folder, folderID);
    })
    .catch(callback);
}

function move(client, entries, callback) {
  client
    .filesMoveBatch({
      entries: entries,
      autorename: false
    })
    .then(function checkBatchStatus(result) {
      if (result.empty) return Promise.resolve(result);

      return client.filesMoveBatchCheck(result).then(function(res) {
        switch (res[".tag"]) {
          case "in_progress":
            return checkBatchStatus(result);
          case "failed":
            return Promise.reject(
              new Error("Failed to move files, please try again.")
            );
          case "complete":
            return Promise.resolve(res);
          default:
            console.log("FAILUERE", res);
            return Promise.reject(new Error("Unknown response " + res));
        }
      });
    })
    .then(function() {
      callback(null);
    })
    .catch(callback);
}
