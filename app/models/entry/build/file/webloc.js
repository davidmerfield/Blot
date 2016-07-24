var helper = require('../../../../helper');

var fs = require('fs');
var extname = require('path').extname;
var INVALID = 'Invalid webloc file';

var ensure = helper.ensure;
var LocalPath = helper.localPath;
var titlify = helper.titlify;

function is (path) {
  return extname(path).toLowerCase() === '.webloc';
}

function read (blog, path, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  var localPath = LocalPath(blog.id, path);
  var url;

  fs.stat(localPath, function(err, stat){

    if (err) return callback(err);

    fs.readFile(localPath, 'utf-8', function (err, contents) {

      if (err) return callback(err);

      // For some reason this must be here...
      var EXTRACT_URL = /<string>(.*)<\/string>/g;

      try {

        url = EXTRACT_URL.exec(contents)[1];
        contents = '<p><a href="' + url + '" class="bookmark">' + titlify(path) + '</a></p>';

      } catch (e) {

        return callback(new Error(INVALID));
      }

      callback(null, contents, stat);
    });
  });
}

module.exports = {is: is, read: read};