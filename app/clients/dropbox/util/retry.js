var async = require("async");

function retry(fn, options) {
  options = options || {};

  // Set our defaults
  options.times = options.times || 6;

  // Exponential backoff
  // 100, 200, 400, 800, 1600, 3200
  options.interval = options.interval || exponential;

  // 401 = token revoked
  // 409 = folder no longer exists
  // in these cases, do not retry, there is no point
  options.errorFilter =
    options.errorFilter ||
    function (err) {
      return [401, 409].indexOf(err.status) === -1;
    };

  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    // Will timeout a single attempt, not the exported function
    if (options.timeout) fn = async.timeout(fn, options.timeout);

    async.retry(
      options,
      function (done) {
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
