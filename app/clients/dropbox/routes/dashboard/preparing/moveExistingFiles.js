var sync = require("sync");
var database = require("clients/dropbox/database");
const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
var async = require("async");
var titleToFolder = require("./titleToFolder");

module.exports = function (req, res, next) {
  var otherBlog = req.otherBlogUsingEntireAppFolder;
  var determineFolder, move;

  if (!otherBlog) return next(new Error("No blog to move"));

  const client = new Dropbox({
    fetch: fetch,
  });

  client.auth.setAccessToken(req.unsavedAccount.access_token);

  determineFolder = async.apply(DetermineFolder, otherBlog.title, client);

  req.folder.status("Moving your existing blog folder into a subdirectory");

  // Get a lock on the blog to ensure no other changes happen during migration
  // might want to add retries here...
  sync(otherBlog.id, function (err, folder, done) {
    if (err) return next(err);

    async.retry(determineFolder, function (err, entries, folder, folderID) {
      if (err) return done(err, next);

      move = async.apply(Move, client, entries);

      async.retry(move, function (err) {
        console.log("error after move", err);
        if (err) return done(err, next);

        database.set(
          otherBlog.id,
          {
            folder: folder,
            folder_id: folderID,
            cursor: "",
          },
          function (err) {
            // The front-end listens for this message, so if you change it
            // also update views/preparing.html
            req.folder.status(
              "Moved your existing blog folder into a subdirectory"
            );
            done(err, next);
          }
        );
      });
    });
  });
};

function DetermineFolder(title, client, callback) {
  var folder = "/" + titleToFolder(title);
  var folderID;
  var entries;

  client
    .filesListFolder({
      path: "",
      include_deleted: false,
      recursive: false,
    })
    .then(function ({ result }) {
      console.log("here", result);

      result.entries.forEach(function (entry) {
        if (entry.path_lower === folder.toLowerCase()) folder += " (1)";
      });

      entries = result.entries.map(function (entry) {
        return {
          from_path: entry.path_display,
          to_path: folder + entry.path_display,
        };
      });

      console.log("here", entries);
      return client.filesCreateFolder({ path: folder, autorename: false });
    })
    .then(function ({ result }) {
      folder = result.path_display;
      folderID = result.id;
      console.log("here too", entries, folder, folderID);
      callback(null, entries, folder, folderID);
    })
    .catch(callback);
}

function Move(client, entries, callback) {
  if (!entries.length) return callback(null);

  client
    .filesMoveBatch({
      entries: entries,
      autorename: false,
    })
    .then(function checkBatchStatus(res) {
      let batchResult = res.result;

      console.log("result, from filesMoveBatch", batchResult);

      if (batchResult.empty) return Promise.resolve(batchResult);

      return client
        .filesMoveBatchCheck(batchResult)
        .then(function ({ result }) {
          console.log("result, from filesMoveBatchCheck", result);

          switch (result[".tag"]) {
            case "in_progress":
              return checkBatchStatus({ result: batchResult });
            case "failed":
              return Promise.reject(
                new Error("Failed to move files, please try again.")
              );
            case "complete":
              return Promise.resolve(result);
            default:
              return Promise.reject(
                new Error("Unknown response " + JSON.stringify(result))
              );
          }
        });
    })
    .then(function () {
      callback(null);
    })
    .catch(callback);
}
