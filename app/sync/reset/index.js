var recursive = require("recursive-readdir");
var helper = require('helper');
var localPath = helper.localPath;
var async = require('async');
var fs = require('fs-extra');
var change = require('../change');
var ensure = require('helper').ensure;

module.exports = function (blogID, callback) {

  ensure(blogID, 'string').and(callback, 'function');

  var folder = localPath(blogID, '/');

  recursive(folder, function (err, contents) {

    async.eachSeries(contents, function(path, next){

      path = path.slice(folder.length - 1);

      change.drop(blogID, path, next);

    }, function(){

      // We should have removed all the files but just
      // in case, do this now.
      fs.emptyDir(folder, callback);
    });
  });
};
