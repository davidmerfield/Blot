var fs = require('fs-extra');
var Metadata = require('metadata');
var helper = require('helper');
var localPath = helper.localPath;
var ensure = helper.ensure;

module.exports = function (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  Metadata.add(blogID, path, function(err){

    if (err) return callback(err);

    fs.ensureDir(localPath(blogID, path), function(err){

      if (err) return callback(err);

      callback();
    });
  });
};

