var sharp = require('sharp');
var helper = require('../../helper');
var UID = helper.makeUid;
var ensure = helper.ensure;
var tempDir = helper.tempDir();
var fs = require('fs');

module.exports = function(path, callback){

  ensure(path, 'string')
    .and(callback, 'function');

  // this path doesn't matter
  // since we'll remove it after the fact
  // to the initial path.
  var output = tempDir + UID(40);

  var image = sharp(path);

  image.quality(100)
       .withoutEnlargement()
       .resize(2000, 1400)
       .max();


  image.toFile(output, function(err, info){

    if (err || !info) return callback(err || 'No info');

    // Remove the unresized file
    fs.unlink(path, function(err){

      if (err) return callback(err);

      // Move the resized file
      fs.rename(output, path, function(err){

        if (err) return callback(err);

        return callback(null, info);
      });
    });
  });
};