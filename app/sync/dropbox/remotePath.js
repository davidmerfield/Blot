var helper = require('../../helper');
var ensure = helper.ensure;
var joinPath = require('path').join;

module.exports = function (blogFolder, path) {

  ensure(blogFolder, 'string')
    .and(path, 'string');

  return joinPath(blogFolder, path);
};