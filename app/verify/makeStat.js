var helper = require('../helper');
var ensure = helper.ensure;
var basename = require('path').basename;

module.exports = function (path, stat) {

  ensure(path, 'string')
    .and(stat, 'object');

  var fileName = basename(path);
  var filePath = path;
  var mtime = stat.mtime;

  var result = {
    path: filePath,
    name: fileName,
    stat: {
      name: fileName,
      path: filePath,
      size: stat.size,
      client_mtime: mtime.toString(),
      is_dir: stat.isDirectory()
    }
  };

  return result;
};