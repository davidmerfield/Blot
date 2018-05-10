var sharp = require('sharp');
var helper = require('../../helper');
var UID = helper.makeUid;
var ensure = helper.ensure;
var tempDir = helper.tempDir();
var fs = require('fs');

// Sharp seems to cache files based on their 
// path and not the contents of the file at 
// a particular path. It was returning stale
// versions of a file in the blog's folder. 
// Perhaps it might be smarter to copy the file
// to the temporary directory before operating on it?
// It's also possible that this is a bug in Sharp's
// caching that has been fixed in a more recent version
// or that still needs to be fixed. I should investigate.
sharp.cache(false);

module.exports = function(path, callback){

  ensure(path, 'string')
    .and(callback, 'function');

  // this path doesn't matter
  // since we'll remove it after the fact
  // to the initial path.
  var output = tempDir + UID(40);

  var image = sharp(path);

  image.quality(100)
       .rotate()
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