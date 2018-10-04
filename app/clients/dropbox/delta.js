var createClient = require("./util/createClient");
var async = require("async");

// The goal of this function is to retrieve a list of changes made
// to the blog folder inside a user's Dropbox folder. We filter out
// changes outside the blog folder and add a new property: relative_path
// to each change which refers to the 'Blot path' of the change.

// We fire off two requests: one to determine the current path to the
// blog's folder in Dropbox. This is needed because the user can rename
// the blog's folder. The second request retrieve all changes to user's
// Dropbox. We use the response from the first to return the desired result.
module.exports = function delta(token, folderID) {
  function get(cursor, callback) {
    var client = createClient(token);
    var requests = [];
    var result = {};

    // We pass in a tag which tells Dropbox what we know
    // to be the previous state of a user's folder
    // so we don't get everything every time...
    if (cursor) {
      requests.push(client.filesListFolderContinue({ cursor: cursor }));
    } else {
      requests.push(
        client.filesListFolder({
          // Dropbox likes root as empty string,
          // so if there is no folder ID this is fine
          path: folderID,
          // We obviously want to know about removed files
          include_deleted: true,
          // We want to know about changes anywhere in the folder
          recursive: true
        })
      );
    }

    if (folderID) {
      // The reason we look up the metadata for the blog's folder
      // is to make sure we can filter the list of all changes to the
      // user's Dropbox folder to a list of only those changes made
      // to this blog's folder in the user's Dropbox. The user might
      // rename this blog's folder, and so we need to fetch its latest
      // path, against which we filter any new changes.
      requests.push(client.filesGetMetadata({ path: folderID }));
    }

    Promise.all(requests)
      .then(function(results) {
        result = results[0];

        if (results[1]) {
          result.path_display = results[1].path_display;
          result.path_lower = results[1].path_lower;
        }

        // Filter entries to only those changes applied
        // to the blog folder and compute the relative
        // path of each change inside the blog folder.
        if (result.path_display) {
          result.entries = result.entries
            .filter(function(entry) {
              return (
                entry.path_lower.indexOf(result.path_lower) === 0 &&
                entry.path_lower !== result.path_lower
              );
            })
            .map(function(entry) {
              entry.relative_path = entry.path_lower.slice(
                result.path_lower.length
              );
              return entry;
            });
        } else {
          result.entries = result.entries.map(function(entry) {
            entry.relative_path = entry.path_lower;
            return entry;
          });
        }

        callback(null, result);
      })
      .catch(function(err) {
        // Professional programmers wrote this SDK
        if (
          err.error &&
          err.error.error &&
          err.error.error[".tag"] === "reset"
        ) {
          cursor = "";
          return get(cursor, callback);
        }

        // Format these terrible Dropbox errors
        if (err.status === 409) {
          err = new Error("Blog folder was removed");
          err.code = "ENOENT";
          err.status = 409;
        } else {
          err = new Error("Failed to fetch delta from Dropbox");
          err.code = "EBADMSG"; // Not a data message
          err.status = 400;
        }

        callback(err, null);
      });
  }

  // try calling get 5 times with exponential backoff
  // (i.e. intervals of 100, 200, 400, 800, 1600 milliseconds)
  return function(cursor, callback) {
    async.retry(
      {
        // Only retry if the folder has not been moved
        errorFilter: function(err) {
          return err.status !== 409;
        },
        times: 5,
        interval: function(retryCount) {
          return 50 * Math.pow(2, retryCount);
        }
      },
      async.apply(get, cursor),
      callback
    );
  };
};
