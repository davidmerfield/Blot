var REQUEST_CONSTANTS = require('./request-constants');
var DropboxBase;

// Polyfill Object.assign() for older browsers
require('./object-assign-polyfill');

/**
 * @private
 * @class DropboxBase
 * @classdesc The main Dropbox SDK class. This contains the methods that are
 * shared between Dropbox and DropboxTeam classes. It is marked as private so
 * that it doesn't show up in the docs because it is never used directly.
 * @arg {Object} options
 * @arg {String} [options.accessToken] - An access token for making authenticated
 * requests.
 * @arg {String} [options.clientId] - The client id fo ryour app. Used to create
 * authentication URL.
 * @arg {Number} [options.selectUser] - User is the team access token would like
 * to act as.
 */
DropboxBase = function (options) {
  options = options || {};
  this.accessToken = options.accessToken;
  this.clientId = options.clientId;
  this.selectUser = options.selectUser;
};

/**
 * Set the access token used to authenticate requests to the API.
 * @arg {String} accessToken - An access token
 * @returns {undefined}
 */
DropboxBase.prototype.setAccessToken = function (accessToken) {
  this.accessToken = accessToken;
};

/**
 * Get the access token
 * @returns {String} Access token
 */
DropboxBase.prototype.getAccessToken = function () {
  return this.accessToken;
};

/**
 * Set the client id, which is used to help gain an access token.
 * @arg {String} clientId - Your apps client id
 * @returns {undefined}
 */
DropboxBase.prototype.setClientId = function (clientId) {
  this.clientId = clientId;
};

/**
 * Get the client id
 * @returns {String} Client id
 */
DropboxBase.prototype.getClientId = function () {
  return this.clientId;
};

/**
 * Get a URL that can be used to authenticate users for the Dropbox API.
 * @arg {String} redirectUri - A URL to redirect the user to after
 * authenticating. This must be added to your app through the admin interface.
 * @arg {String} [state] - State that will be returned in the redirect URL to help
 * prevent cross site scripting attacks.
 * @returns {String} Url to send user to for Dropbox API authentication
 */
DropboxBase.prototype.getAuthenticationUrl = function (redirectUri, state) {
  var AUTH_BASE_URL = 'https://www.dropbox.com/oauth2/authorize';
  var clientId = this.getClientId();
  var authUrl;
  if (!clientId) {
    throw new Error('A client id is required. You can set the client id using .setClientId().');
  }
  if (!redirectUri) {
    throw new Error('A redirect uri is required.');
  }

  authUrl = AUTH_BASE_URL + '?response_type=token&client_id=' + clientId;
  if (redirectUri) {
    authUrl = authUrl + '&redirect_uri=' + redirectUri;
  }
  if (state) {
    authUrl = authUrl + '&state=' + state;
  }
  return authUrl;
};

/**
 * Called when the authentication succeed
 * @callback successCallback
 * @param {string} access_token The application's access token
 */

/**
 * Called when the authentication failed.
 * @callback errorCallback
 */

/**
 * An authentication process that works with cordova applications.
 * @param {successCallback} successCallback
 * @param {errorCallback} errorCallback 
 */
DropboxBase.prototype.authenticateWithCordova = function (successCallback, errorCallback)
{
  var redirect_url = 'https://www.dropbox.com/1/oauth2/redirect_receiver';
  var url = this.getAuthenticationUrl(redirect_url);
  var browser = window.open(url, '_blank');
  var removed = false;

  var onLoadError = function(event) {
    // Try to avoid a browser crash on browser.close().
    window.setTimeout(function() { browser.close() }, 10);
    errorCallback();
  }

  var onLoadStop = function(event) {
    var error_label = '&error=';
    var error_index = event.url.indexOf(error_label);

    if (error_index > -1) {
      // Try to avoid a browser crash on browser.close().
      window.setTimeout(function() { browser.close() }, 10);
      errorCallback();
    } else { 
      var access_token_label = '#access_token=';
      var access_token_index = event.url.indexOf(access_token_label);
      var token_type_index = event.url.indexOf('&token_type=');
      if (access_token_index > -1) {
        access_token_index += access_token_label.length;
        // Try to avoid a browser crash on browser.close().
        window.setTimeout(function() { browser.close() }, 10);

        var access_token = event.url.substring(access_token_index, token_type_index);
        successCallback(access_token);
      }
    }
  };

  var onExit = function(event) {
    if(removed) {
      return 
    }
    browser.removeEventListener('loaderror', onLoadError);
    browser.removeEventListener('loadstop', onLoadStop);
    browser.removeEventListener('exit', onExit);
    removed = true
  };
  
  browser.addEventListener('loaderror', onLoadError);
  browser.addEventListener('loadstop', onLoadStop);
  browser.addEventListener('exit', onExit)
}

DropboxBase.prototype.request = function (path, args, auth, host, style) {
  var request = null;
  switch (style) {
    case REQUEST_CONSTANTS.RPC:
      request = this.getRpcRequest();
      break;
    case REQUEST_CONSTANTS.DOWNLOAD:
      request = this.getDownloadRequest();
      break;
    case REQUEST_CONSTANTS.UPLOAD:
      request = this.getUploadRequest();
      break;
    default:
      throw new Error('Invalid request style: ' + style);
  }

  return request(path, args, auth, host, this.getAccessToken(), this.selectUser);
};

DropboxBase.prototype.setRpcRequest = function (newRpcRequest) {
  DropboxBase.prototype.rpcRequest = newRpcRequest;
};

DropboxBase.prototype.getRpcRequest = function () {
  if (DropboxBase.prototype.rpcRequest === undefined) {
    DropboxBase.prototype.rpcRequest = require('./rpc-request');
  }

  return DropboxBase.prototype.rpcRequest;
};

DropboxBase.prototype.setDownloadRequest = function (newDownloadRequest) {
  DropboxBase.prototype.downloadRequest = newDownloadRequest;
};

DropboxBase.prototype.getDownloadRequest = function () {
  if (DropboxBase.prototype.downloadRequest === undefined) {
    DropboxBase.prototype.downloadRequest = require('./download-request');
  }

  return DropboxBase.prototype.downloadRequest;
};

DropboxBase.prototype.setUploadRequest = function (newUploadRequest) {
  DropboxBase.prototype.uploadRequest = newUploadRequest;
};

DropboxBase.prototype.getUploadRequest = function () {
  if (DropboxBase.prototype.uploadRequest === undefined) {
    DropboxBase.prototype.uploadRequest = require('./upload-request');
  }

  return DropboxBase.prototype.uploadRequest;
};

module.exports = DropboxBase;
