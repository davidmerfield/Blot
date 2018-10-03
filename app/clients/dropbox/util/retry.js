var debug = require("debug")("clients:dropbox:retry");

/*


    // Network error, new sync after a bit
    if (code === 0 || code === 500 || code === 504) {
      email.NETWORK_ERROR(uid);
      log('Network error accessing Dropbox API: ' + code);
      tryAgain = true;
    }

    // Hitting rate limits, try again after delay
    // specified in error.Retry-After ?
    if (code === 429 || code === 503) {
      email.RATE_LIMIT(uid);
      log('Rate limit error accessing Dropbox API: ' + code);
      tryAgain = true;
    }

    // User is over their dropbox storage quota
    if (code === 507) {
      email.NO_SPACE(uid);
      log('No space in Dropbox folder: ' + code);
    }

    // Blot is sending bad requests
    if (code === 400 || code === 403) {
      email.BAD_REQUEST(uid);
      log('Bad request to Dropbox API: ' + code);
    }

    // The user's dropbox access token has
    // expired or been revoked. This can be
    // fixed if the user visits /auth
    if (code === 401) {
      email.REVOKED(uid);
      log('Dropbox access token is invalid: ' + code);
    }


 { [FetchError: request to https://content.dropboxapi.com/2/files/download failed, reason: getaddrinfo ENOTFOUND content.dropboxapi.com content.dropboxapi.com:443]
  name: 'FetchError',
  message: 'request to https://content.dropboxapi.com/2/files/download failed, reason: getaddrinfo ENOTFOUND content.dropboxapi.com content.dropboxapi.com:443',
  type: 'system',
  errno: 'ENOTFOUND',
  code: 'ENOTFOUND' }

*/

// HTTP error codes
var RETRY_STATUSES = [
  0,
  500,
  504, // network error
  429,
  503 // rate limit error
];

var RETRY_CODES = ["ENOTFOUND"];

// 100-200ms between requests
var INTERVAL = 100;
var JITTER = 100;

// Max retries
var LIMIT = 10;

module.exports = function retry(callback, main, handleErr, options) {
  options = options || {};

  var retries = 0;
  var interval = options.interval || INTERVAL;
  var jitter = options.jitter || JITTER;
  var limit = options.limit || LIMIT;
  var delay = 0;

  debug("Initialized retry, interval:" + interval + " limit:" + limit);

  function retryMain() {
    debug("Waiting " + delay + "ms to retry main function");

    setTimeout(function() {
      retries++;

      debug("Retrying main function for the " + retries + " time");

      main(handleErrWrapper);
    }, delay);
  }

  function handleErrWrapper(err) {
    debug("Error wrapper invoked");

    if (retries >= limit) {
      debug("Hit limit, end now");
      return callback(err);
    }

    // Calculate the delay for the next retry if it is invoked
    if (err.error && err.error.error && err.error.error.retry_after) {
      delay = err.error.error.retry_after * 1000;
    } else {
      delay = interval + jitter * Math.random();
    }

    // We know this err is retryable immediately
    if (
      RETRY_STATUSES.indexOf(err.status) !== -1 ||
      RETRY_CODES.indexOf(err.code) !== -1
    ) {
      debug(err.status + "is retryable");
      return retryMain();
    }

    if (!handleErr) {
      return callback(err);
    }

    try {
      handleErr(err, retryMain);
    } catch (e) {
      debug("Error in handler", e);
      callback(e);
    }
  }

  debug("Invoking main");
  main(handleErrWrapper);
};
