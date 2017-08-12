var helper = require('../../../helper');
var ensure = helper.ensure;
var normalize = helper.pathNormalizer;

module.exports = function (folder, changes, callback) {

  ensure(folder, 'string')
    .and(changes, 'array')
    .and(callback, 'function');

  // No we determine if the change
  // is inside the folder for a blog.
  // N() normalizes paths to lowercase,
  // with a leading slash and no trailing.
  changes = changes.filter(function(change){
    return normalize(change.path).indexOf(normalize(folder)) === 0;
  });

  // This change is inside a folder for a user's blog!
  // Now we work out three paths which Blot needs.
  // If the blog folder path is "/david" and the
  // changed file path is "/david/test.txt" then change
  // its path to "/test.txt"
  if (folder && folder !== '/') changes = changes.map(function(change){

    change.path = change.path.slice(folder.length);

    return change;
  });

  return callback(null, changes);
};