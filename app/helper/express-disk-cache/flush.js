var fs = require("fs-extra");
var join = require("path").join;

// This method is used to clear the disk cache for a given
// hostname, e.g. example.com. All the cached responses
// are stored in a folder like this: {cache_dir}/{host_name}/...
// so flushing the cache is as simple as emptying this folder.

// What happens if we flush the cache, while writing to the cache?
// Does the writeStream close with an error? Or does it keep writing?
// We want the writestream to close, and to stop. I think it will.
module.exports = function (cache_directory) {
  if (!cache_directory) throw new Error("Pass a cache directory");

  return async function ({ host, path = "/" } = {}, callback = () => {}) {
    if (!host) return callback(new Error("Pass a host"));

    try {
      await fs.emptyDir(join(cache_directory, host, path));
    } catch (e) {}

    callback();
  };
};
