var Blog = require('../../../models/blog');
var helper = require('../../../helper');
var normalize = helper.pathNormalizer;
var forEach = helper.forEach;
var ensure = helper.ensure;

var getBlogFolders = require('./getBlogFolders');
var findNewFolder = require('./findNewFolder');

module.exports = function (uid, changes, callback) {

  ensure(uid, 'string')
    .and(changes, 'array')
    .and(callback, 'function');

  getBlogFolders(uid, function(err, folders){

    if (err) return callback(err);

    // Used to check if a blog folder exists
    // on the list of changes from dropbox
    var stillExists = StillExists(changes);

    // Lets check each blog folder
    // to see if it matches a removed folder
    forEach(folders, function(folder, blogID, nextBlog){

      // This blog folder exists and wasn't removed
      if (stillExists(folder)) return nextBlog();

      // Uh oh, we've found a removed or nonexistent blog folder!
      findNewFolder(blogID, folder, changes, function(err, newFolder){

        // Sometimes we set the new folder
        // to an empty string is no good replacement
        // exists. We hope in future to find a candidate
        if (err || !newFolder) newFolder = '';

        Blog.set(blogID, {folder: newFolder}, nextBlog);
        console.log('Blog:', blogID + ':', 'Renaming blog folder from', folder, 'to', newFolder);
      });
    }, callback);
  });
};

function StillExists (changes) {

  // Since removed changes don't contain a stat object
  // we have to check all files and folders.
  var dropped = changes.filter(function(c){
    return c.wasRemoved;
  });

  // Build a list of normalized, removed files
  // and folders to compare with blog folders.
  dropped = dropped.map(function(c){
    return normalize(c.path);
  });

  return function (folder) {
    return folder !== '' && dropped.indexOf(normalize(folder)) === -1;
  };
}