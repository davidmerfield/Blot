var NO_ENTRIES = 'Expected entries from Dropbox';
var NO_CURSOR = 'Expected cursor from Dropbox';
var Dropbox = require('dropbox');
var Database = require('database');
var helper = require('helper');
var ensure = helper.ensure;
var forEach = helper.forEach;

module.exports = function delta (blogID, account, callback) {

  ensure(blogID, 'string')
    .and(account, 'object')
    .and(callback, 'function');

  var has_more, changes, latest_cursor;
  var client = new Dropbox({accessToken: account.token});
  var cursor = account.cursor;
  var folder_id = account.folder_id;
  var folder = '';
  var methods = [];
  var errors = [];

  // We pass in a tag which tells Dropbox what we know
  // to be the previous state of a user's folder
  // so we don't get everything every time...
  if (cursor) {
    console.log('we have cursor!', cursor);
    methods.push(filesListFolderContinue.bind(this, client, cursor));
  } else {
    console.log('we dont have cursor :( using folder_id:', folder_id);
    methods.push(filesListFolder.bind(this, client, folder_id));
  }

  if (folder_id) {
    console.log('we have folder_id', folder_id);
    methods.push(filesGetMetadata.bind(this, client, folder_id));
  }

  forEach.parallel(methods, function(method, next){

    method(function(err, res){

      if (err || !res) {
        errors.push(err || new Error('No response from Dropbox'));
        return next();
      }

      if (res.entries) changes = res.entries;
      if (res.cursor) latest_cursor = res.cursor;
      if (res.has_more) has_more = res.has_more;
      if (res.path_display) folder = res.path_display;

      next();
    });

  }, function(){

    var folder_missing = errors.length && errors[0].status === 409;
    var folder_moved = folder_missing && folder;

    // We were still able to retrieve the metadata
    // for this folder but the cursor is invalid.
    // This means the folder was renamed, not removed.
    if (folder_moved) {
      account.cursor = '';
      console.log('Folder moved, retrying!');
      return delta(blogID, account, callback);
    }

    if (!changes) errors.push(new Error(NO_ENTRIES));
    if (!latest_cursor) errors.push(new Error(NO_CURSOR));

    if (errors.length) {
      account.valid = 0;
      account.error = errors[0].status || 400;
      console.log('here', account);
      return Database.set(blogID, account, function(err){
        callback(err || errors[0]);
      });
    }

    account.cursor = latest_cursor;
    account.valid = Date.now();
    account.error = 0;

    changes = changes.map(function(c){
      c.path = folder ? c.path_display.slice(folder.length) : c.path_display;
      return c;
    });

    Database.set(blogID, account, function(err){

      if (err) return callback(err);

      // We save the state before dealing with the changes
      // to avoid an infinite loop if one of these changes
      // causes an exception. If sync enounters an exception
      // it will verify the folder at a later date
      callback(null, changes, has_more);
    });
  });
};

// This is a dumb callback wrapper around Dropbox's
// fucking stupid promise-based js client. FUCK PROMISES.
function filesListFolder (client, folder_id, callback) {

  client.filesListFolder({path: folder_id, include_deleted: true, recursive: true})
    .then(callback.bind(this, null))
    .catch(callback);

}

// This is a dumb callback wrapper around Dropbox's
// fucking stupid promise-based js client. FUCK PROMISES.
function filesListFolderContinue (client, cursor, callback) {

  client.filesListFolderContinue({cursor: cursor})
    .then(callback.bind(this, null))
    .catch(callback);
}

// This is a dumb callback wrapper around Dropbox's
// fucking stupid promise-based js client. FUCK PROMISES.
function filesGetMetadata (client, folder_id, callback) {

  client.filesGetMetadata({path: folder_id})
    .then(callback.bind(this, null))
    .catch(callback);

}