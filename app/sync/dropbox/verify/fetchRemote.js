var helper = require('../../../helper');
var ensure = helper.ensure;
var basename = require('path').basename;
var joinPath = require('path').join;

module.exports = function (blog, client) {

  ensure(blog, 'object')
    .and(client, 'object');

  var root = blog.folder;

  return function (path, callback) {

    ensure(path, 'string')
      .and(callback, 'function');

    var contents = [];
    var dir = joinPath(root, path);

    client.readdir(dir, function(err, stat, _contents){

      if (err) return callback(err);

      // console.log(_contents);

      _contents = _contents._json.contents;

      _contents.forEach(function(file){

        // Dropbox doesn't send this for some
        // reason.
        var fileName = basename(file.path);

        // Ignore dotfiles, we dont want them!
        if (fileName.charAt(0) === '.')
          return;

        // This path is relative to the user's
        // blog folder. We can't simply use
        // file.path since some users may have
        // multiple blogs.
        var filePath = joinPath(path, fileName);

        var mtime = new Date(file.client_mtime).getTime();

        // console.log('  --- name', fileName, ' --- path', filePath, ' --- mtime', mtime);

        contents.push({
          path: filePath,
          stat: {
            size: file.bytes,
            client_mtime: mtime,
            name: fileName,
            path: filePath,
            is_dir: file.is_dir
          }
        });
      });

      return callback(null, contents);
    });
  };
};