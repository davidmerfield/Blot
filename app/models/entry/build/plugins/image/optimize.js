var helper = require('helper');
var ensure = helper.ensure;

var upload = require('../../../../../upload');
var resize = require('./resize');
var minify = require('./minify');

module.exports = function (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  resize(path, function(err, info){

    if (err) return callback(err);

    minify(path, function(err){

      if (err) return callback(err);

      var options = {
        blogID: blogID,
        folder: 'image-cache'
      };

      upload(path, options, function(err, url){

        if (err) return callback(err);

        callback(null, {
          url: url,
          width: info.width,
          height: info.height
        });
      });
    });
  });
};