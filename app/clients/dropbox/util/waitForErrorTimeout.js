var debug = require("debug")("blot:clients:dropbox:waitForErrorTimeout");

// Check if the error returned from Dropbox has a delay
// before we should retry the request. Search for 'retry_after'
// in the documentation for more:
// http://dropbox.github.io/dropbox-sdk-js/global.html
module.exports = function waitForErrorTimeout(err) {
  debug(err);

  // These crazy nested errors are returned by Dropbox
  var delay = err.error && err.error.error && err.error.error.retry_after;

  // Alternative location of retry-after value
  if (!delay) {
    // Header will have a string value, we need an integer
    delay =
      err.headers &&
      err.headers["retry-after"] &&
      parseInt(err.headers["retry-after"]);
  }

  debug("delay", delay);

  // It would be nice to use async.retry's features but there
  // is no support for a custom dynamic interval between retries,
  // so we have to use this for now.
  if (delay) {
    debug("Waiting", delay, "seconds to re-throw error");
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        debug("Wait over, re-throwing error");
        reject(err);
      }, delay * 1000); // delay is in seconds, convert to ms
    });
  } else {
    debug("Throwing error immediately");
    return Promise.reject(err);
  }
};
