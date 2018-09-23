var resize = require('./resize');
var minify = require('./minify');

module.exports = function (path, callback) {

  resize(path, function(err, info){

    if (err) return callback(err);
    
    minify(path, function(err){

      if (err) return callback(err);

      info.path = path;
      
      callback(null, info);
    });
  });
};