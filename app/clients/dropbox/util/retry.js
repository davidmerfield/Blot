var async = require("async");

function retry(fn, options) {
  options = options || {};

  // Set our defaults
  options.times = options.times || 6;

  // Exponential backoff
  options.interval = options.interval || exponential;

  return function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    // Will timeout a single attempt, not the exported function
    if (options.timeout) fn = async.timeout(fn, options.timeout);

    async.retry(
      options,
      function(done) {
        fn.apply(null, args.concat(done));
      },
      callback
    );
  };
}

// Exponential backoff
function exponential(retryCount) {
  return 50 * Math.pow(2, retryCount);
}

module.exports = retry;
