var fs = require('fs-extra');
var dch = require('./main');

module.exports = function (path, callback) {

  var hasher = dch.create();
  var f = fs.createReadStream(path);

  f.on('data', function(buf) {
    hasher.update(buf);
  });

  f.on('end', function() {
    var hexDigest = hasher.digest('hex');
    callback(null, hexDigest);
  });

  f.on('error', callback);
};