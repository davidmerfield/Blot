var request = require('superagent');
var Promise = require('es6-promise').Promise;
var getBaseURL = require('./get-base-url');
var httpHeaderSafeJson = require('./http-header-safe-json');

// This doesn't match what was spec'd in paper doc yet
var buildCustomError = function (error, response) {
  return {
    status: error.status,
    error: (response ? response.text : null) || error.toString(),
    response: response
  };
};

var uploadRequest = function (path, args, auth, host, accessToken, selectUser) {
  if (auth !== 'user') {
    throw new Error('Unexpected auth type: ' + auth);
  }

  var promiseFunction = function (resolve, reject) {
    var apiRequest;

    // Since args.contents is sent as the body of the request and not added to
    // the url, it needs to be remove it from args.
    var contents = args.contents;
    delete args.contents;

    function success(data) {
      if (resolve) {
        resolve(data);
      }
    }

    function failure(error) {
      if (reject) {
        reject(error);
      }
    }

    function responseHandler(error, response) {
      if (error) {
        failure(buildCustomError(error, response));
      } else {
        success(response.body);
      }
    }

    apiRequest = request.post(getBaseURL(host) + path)
      .type('application/octet-stream')
      .set('Authorization', 'Bearer ' + accessToken)
      .set('Dropbox-API-Arg', httpHeaderSafeJson(args));

    if (selectUser) {
      apiRequest = apiRequest.set('Dropbox-API-Select-User', selectUser);
    }

    apiRequest
      .send(contents)
      .end(responseHandler);
  };

  return new Promise(promiseFunction);
};

module.exports = uploadRequest;
