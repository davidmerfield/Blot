var Flush = require('./flush');
var Middleware = require('./middleware');

module.exports = function (cache_directory) {

  var main;

  // This is the middleware function responsible for
  // saving cachable responses to disk.
  main = Middleware(cache_directory);

  // This ensures the cache folder for a given hostname exists
  // and is empty inside the cache directory.
  main.flush = Flush(cache_directory);

  return main;
};