var fs = require('fs-extra');
var join = require('path').join;

// This method is used to clear the disk cache for a given
// hostname, e.g. example.com. All the cached responses
// are stored in a folder like this: {cache_dir}/{host_name}/...
// so flushing the cache is as simple as emptying this folder. 

// What happens if we flush the cache, while writing to the cache?
// Does the writeStream close with an error? Or does it keep writing?
// We want the writestream to close, and to stop. I think it will.
module.exports = function (cache_directory) {

  if (!cache_directory) throw new Error('Pass a cache directory');

  return function flush (hostname, callback) {

    // Often we don't care if the cache clears 
    // successfully or not, perhaps we should?
    callback = callback || function (err) {
      if (err) throw new Error('express-disk-cache: Flush Error ' + err.message);
    };
    
    // If the directory doesn't exist, this creates the directory.
    // If the directory does exist, this removes any files inside.
    fs.emptyDir(join(cache_directory, hostname), callback);
  };
};