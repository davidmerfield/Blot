var helper = require('../helper');
var ensure = helper.ensure;
var async = require('async');
var Upload = require('../upload');

module.exports = function (blogID, thumbnails, callback) {

  ensure(blogID, 'string')
    .and(thumbnails, 'object')
    .and(callback, 'function');

  async.eachOf(thumbnails, function (info, name, next){

    var path = info.path;
    var options = {
      blogID: blogID,
      folder: 'thumbnails'
    };

    Upload(path, options, function(err, url){

      if (err) delete thumbnails[name];

      if (url) {
        thumbnails[name].url = url;
        delete thumbnails[name].path;
      }

      next();
    });

  }, function () {
    callback(null, thumbnails);
  });
};