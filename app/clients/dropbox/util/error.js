// The purpose of this module is to
// take an error which occurs during the
// sync process, notify the user and me
// if appropriate, then determine whether
// it is worth attempting the sync again.

// Refer to error codes in docs here:
// https://www.dropbox.com/developers/core/docs

// Ensure that any error that makes it here
// is actually an instance of an error.
var helper = require("helper");
var ensure = helper.ensure;
var email = helper.email;

module.exports = function(uid, log, options) {
  ensure(uid, "string")
    .and(log, "function")
    .and(options, "object");

  return function handler(error) {
    error = error || {};

    var code = error.status,
      tryAgain = false;

    // Network error, new sync after a bit
    if (code === 0 || code === 500 || code === 504) {
      email.NETWORK_ERROR(uid);
      log("Network error accessing Dropbox API: " + code);
      tryAgain = true;
    }

    // Hitting rate limits, try again after delay
    // specified in error.Retry-After ?
    if (code === 429 || code === 503) {
      email.RATE_LIMIT(uid);
      log("Rate limit error accessing Dropbox API: " + code);
      tryAgain = true;
    }

    // User is over their dropbox storage quota
    if (code === 507) {
      email.NO_SPACE(uid);
      log("No space in Dropbox folder: " + code);
    }

    // Blot is sending bad requests
    if (code === 400 || code === 403) {
      email.BAD_REQUEST(uid);
      log("Bad request to Dropbox API: " + code);
    }

    // The user's dropbox access token has
    // expired or been revoked. This can be
    // fixed if the user visits /auth
    if (code === 401) {
      email.REVOKED(uid);
      log("Dropbox access token is invalid: " + code);
    }

    // Flag the error if Blot
    // should try and sync again
    error.tryAgain = tryAgain;
    return error;
  };
};
