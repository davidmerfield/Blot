var NO_ENTRIES = 'Expected entries from Dropbox';
var NO_CURSOR = 'Expected cursor from Dropbox';
var Dropbox = require('dropbox');
var Database = require('database');
var ensure = require('helper').ensure;

module.exports = function delta (blogID, account, callback, changes) {

  ensure(blogID, 'string')
    .and(account, 'object')
    .and(callback, 'function');

  var client = new Dropbox({accessToken: account.token});
  var path = account.folder || '';

  // Dropbox prefers empty string for root...
  if (path === '/') path = '';

  changes = changes || [];

  // We pass in a tag which tells Dropbox what we know
  // to be the previous state of a user's folder
  // so we don't get everything every time...

  if (account.cursor) {

    client.filesListFolderContinue({cursor: account.cursor})
      .then(done)
      .catch(callback);

  } else {

    client.filesListFolder({path: path, include_deleted: true, recursive: true})
      .then(done)
      .catch(callback);
  }

  function done (res){

    console.log(res);

    if (!res.entries) return callback(new Error(NO_ENTRIES));

    if (!res.cursor) return callback(new Error(NO_CURSOR));

    changes = changes.concat(res.entries);
    account.cursor = res.cursor;
    account.valid = Date.now();

    // If Dropbox says there are more changes
    // we get them before returning the callback.
    // This is important because a rename could
    // be split across two pages of file events.
    if (res.has_more) return delta(blogID, account, callback, changes);

    Database.set(blogID, account, function(err){

      if (err) return callback(err);

      // We save the state before dealing with the changes
      // to avoid an infinite loop if one of these changes
      // causes an exception. If sync enounters an exception
      // it will verify the folder at a later date
      callback(null, changes);
    });
  }
};