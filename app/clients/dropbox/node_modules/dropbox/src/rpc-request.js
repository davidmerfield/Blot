var request = require('superagent');
var Promise = require('es6-promise').Promise;
var getBaseURL = require('./get-base-url');

// This doesn't match what was spec'd in paper doc yet
var buildCustomError = function (error, response) {
  var err;
  if (response) {
    try {
      err = JSON.parse(response.text);
    } catch (e) {
      err = response.text;
    }
  }
  return {
    status: error.status,
    error: err || error,
    response: response
  };
};

var rpcRequest = function (path, body, auth, host, accessToken, selectUser) {
  var promiseFunction = function (resolve, reject) {
    var apiRequest;

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

    // The API expects null to be passed for endpoints that dont accept any
    // parameters
    if (!body) {
      body = null;
    }

    apiRequest = request.post(getBaseURL(host) + path)
      .type('application/json');

    switch (auth) {
      case 'team':
      case 'user':
        apiRequest.set('Authorization', 'Bearer ' + accessToken);
        break;
      case 'noauth':
        break;
      default:
        throw new Error('Unhandled auth type: ' + auth);
    }

    if (selectUser) {
      apiRequest = apiRequest.set('Dropbox-API-Select-User', selectUser);
    }

    apiRequest.send(body)
      .end(responseHandler);
  };

  return new Promise(promiseFunction);
};

module.exports = rpcRequest;
