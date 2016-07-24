var fs = require('fs');
var helper = require('../../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach.parallel;
var localPath = helper.localPath;
var joinPath = require('path').join;

var Emit = require('./emit');

var rm = helper.remove;
var mkdirp = helper.mkdirp;

module.exports = function (blog) {

  ensure(blog, 'object');

  var emit = Emit(blog.id);

  return function read (path, callback) {

    ensure(path, 'string')
      .and(callback, 'function');

    var contents = [];
    var dir = localPath(blog.id, path);

    fs.readdir(dir, function (err, _localContents) {

      if (err && err.code === 'ENOENT') {
        emit('xx Need to make dir, trying again' + path);
        return mkdirp(dir, tryAgain);
      }

      if (err && err.code === 'ENOTDIR') {
        emit('xx Need to delete the file here, trying again' + path);
        return rm(dir, tryAgain);
      }

      if (err)
        return callback(err);

      forEach(_localContents, function(fileName, next){

        if (fileName.charAt(0) === '.') return next();

        fs.stat(dir + '/' + fileName, function(err, stat){

          var mtime = new Date(stat.mtime).getTime();

          var filePath = joinPath(path, fileName);

          // console.log('  --- name', fileName, ' --- path', filePath, ' --- mtime', mtime);

          contents.push({
            path: filePath,
            stat: {
              size: stat.size,
              client_mtime: mtime,
              name: fileName,
              path: filePath,
              is_dir: stat.isDirectory()
            }
          });

          next();
        });
      }, function(){
        return callback(null, contents);
      });
    });

    function tryAgain (err) {

      if (err) return callback(err);

      return read(path, callback);
    }

  };
};