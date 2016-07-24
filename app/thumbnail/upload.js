var helper = require('../helper');
var ensure = helper.ensure;
var forEach = helper.forEach.parallel;
var Upload = require('../upload');
var UID = helper.makeUid;

module.exports = function (blogID, thumbnails, callback) {

  ensure(blogID, 'string')
    .and(thumbnails, 'object')
    .and(callback, 'function');

  forEach(thumbnails, function (name, info, next){

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