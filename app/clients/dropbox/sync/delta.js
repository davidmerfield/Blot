var NO_ENTRIES = 'Expected entries from Dropbox';
var NO_CURSOR = 'Expected cursor from Dropbox';

module.exports = function delta (client, cursor, callback, changes) {

  changes = changes || [];

  // We pass in a tag which tells Dropbox what we know
  // to be the previous state of a user's folder
  // so we don't get everything every time...

  if (cursor) {

    client.filesListFolderContinue({cursor: cursor})
      .then(done)
      .catch(callback);

  } else {

    client.filesListFolder({path: '', recursive: true})
      .then(done)
      .catch(callback);
  }

  function done (res){

    if (!res.entries) return callback(new Error(NO_ENTRIES));

    if (!res.cursor) return callback(new Error(NO_CURSOR));

    changes = changes.concat(res.entries);
    cursor = res.cursor;

    // If Dropbox says there are more changes
    // we get them before returning the callback.
    // This is important because a rename could
    // be split across two pages of file events.
    if (res.has_more) return delta(client, cursor, callback, changes);

    // We save the state before dealing with the changes
    // to avoid an infinite loop if one of these changes
    // causes an exception. If sync enounters an exception
    // it will verify the folder at a later date
    callback(null, changes, cursor);
  }
};