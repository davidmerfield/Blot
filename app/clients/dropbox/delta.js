var createClient = require("./util/createClient");

// The goal of this function is to retrieve a list of changes made
// to the blog folder inside a user's Dropbox folder. We filter out
// changes outside the blog folder and add a new property: relative_path
// to each change which refers to the 'Blot path' of the change.

// We fire off two requests: one to determine the current path to the
// blog's folder in Dropbox. This is needed because the user can rename
// the blog's folder. The second request retrieve all changes to user's
// Dropbox. We use the response from the first to return the desired result.
module.exports = function delta(token, folderID) {
  return function get(cursor, callback) {
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
          include_deleted: true,
          recursive: true
        })
      );
    }

    if (folderID) {
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
          err &&
          err.error &&
          err.error.error &&
          err.error.error[".tag"] === "reset"
        ) {
          cursor = "";
          return get(cursor, callback);
        }

        console.log("ERROR", err);
        callback(err);

        // var folder_missing = errors.length && errors[0].status === 409;
        // var folder_moved = folder_missing && result.path_display;

        // // We were still able to retrieve the metadata
        // // for this folder but the cursor is invalid.
        // // This means the folder was renamed, not removed.
        // if (folder_moved) {
        //   cursor = "";
        //   return delta(token, cursor, folderID, callback);
        // }

        // if (errors.length) {
        //   return callback(errors[0]);
        // }
      });
  };
};
