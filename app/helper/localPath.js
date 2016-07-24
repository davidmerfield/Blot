var blogDir = require('./blogDir');
var ensure = require('./ensure');
var normalize = require('./pathNormalizer');
var joinPath = require('path').join;

// This takes a blog ID and a file
// path and returns the path to the file
// on the server.

module.exports = function (blogID, path) {

  ensure(blogID, 'string')
    .and(path, 'string');

  // THIS LOWERCASES THE PATH
  path = normalize(path);

  return joinPath(blogDir, blogID, path);
};