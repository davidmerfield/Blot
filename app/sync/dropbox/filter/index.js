var helper = require('../../../helper');
var ensure = helper.ensure;

var n = helper.pathNormalizer;
var forEach = helper.forEach;

var renamedBlogFolder = require('./renamedBlogFolder');
var getBlogFolders = require('./getBlogFolders');

function isDotfile (path) {

  var dirs = path.split('/');

  for (var i in dirs)
    if (dirs[i].indexOf('.') === 0)
      return true;

  return false;
}

module.exports = function (uid, changes, callback) {

  ensure(uid, 'string')
    .and(changes, 'array')
    .and(callback, 'function');

  // We dont care about dotfiles
  changes = changes.filter(function(c){
    return !isDotfile(c.path);
  });

  // Determine if one of the user's blog folders
  // was renamed. If so, save the new blog folder.
  renamedBlogFolder(uid, changes, function(err){

    if (err) return callback(err);

    var blogs = {};

    // We must fetch the user after checking
    // for renamed folders to ensure we are using
    // the latest list of blog folders.

    getBlogFolders(uid, function(err, folders){

      if (err) return callback(err);

      forEach(changes, function(change, nextChange){

        forEach(folders, function(blogFolder, blogID, nextBlog){

          // No we determine if the change
          // is inside the folder for a blog.
          // N() normalizes paths to lowercase,
          // with a leading slash and no trailing.
          if (n(change.path).indexOf(n(blogFolder)) !== 0)
            return nextBlog();

          // Ignore root folder changes (we dont want to wipe
          // local blog directory etc)
          if (n(change.path) === n(blogFolder))
            return nextBlog();

          // This change is inside a folder for a user's blog!
          // Now we work out three paths which Blot needs.
          // If the blog folder path is "/david" and the
          // changed file path is "/david/test.txt" then change
          // its path to "/test.txt"
          if (blogFolder !== '/') {
            change.path = change.path.slice(blogFolder.length);
          }

          blogs[blogID] = blogs[blogID] || [];
          blogs[blogID].push(change);

          nextBlog();

        }, nextChange);

      }, function(){

        return callback(err, blogs);
      });
    });
  });
};