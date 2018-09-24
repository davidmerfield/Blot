var helper = require('helper');
var ensure = helper.ensure;
var fs = require('fs-extra');
var upload = helper.upload;
var resize = require('./resize');
var minify = require('./minify');
var basename = require('path').basename;
var uuid = require('uuid/v4');
var join = require('path').join;

module.exports = function (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  var tmpPath = join(helper.tempDir(),uuid(),basename(path));

  // We need to make a copy to avoid potentially modifying
  // a file in the user's folder.
  fs.copy(path, tmpPath, function(err){

    if (err) return callback(err);

    resize(tmpPath, function(err, info){

      if (err) return callback(err);

      minify(tmpPath, function(err){

        if (err) return callback(err);

        var options = {
          blogID: blogID,
          folder: 'image-cache'
        };

        upload(tmpPath, options, function(err, url){

          if (err) return callback(err);

          fs.remove(tmpPath, function(err){

            if (err) return callback(err);
            
            callback(null, {
              url: url,
              width: info.width,
              height: info.height
            });
          });
        });
      });
    });
  });  
};