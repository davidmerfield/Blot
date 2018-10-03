'use strict';

var got = require('got');

var apiBase = 'https://content.dropboxapi.com/2';
var api = {
  base: apiBase,
  download: apiBase + '/files/download',
  upload: apiBase + '/files/upload',
  uploadStart: apiBase + '/files/upload_session/start',
  uploadAppend: apiBase + '/files/upload_session/append_v2',
  uploadFinish: apiBase + '/files/upload_session/finish'
};

var charsToEncode = /[\u007f-\uffff]/g;
var saveJsonStringify = function saveJsonStringify(obj) {
  return JSON.stringify(obj).replace(charsToEncode, function (c) {
    return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
};

var safeJsonParse = function safeJsonParse(data) {
  if (!data) {
    return;
  }

  try {
    var parsedData = JSON.parse(data);
    return parsedData;
  } catch (e) {
    return new Error(`Response parsing failed: ${e.message}`);
  }
};

var parseResponse = function parseResponse(cb, isDownload) {
  return function (res) {
    var statusCode = res.statusCode;

    if (statusCode !== 200) {
      res.resume();
      return cb(new Error(`Request Failed.\nStatus Code: ${statusCode}`));
    }

    if (isDownload) {
      var _rawData = res.headers['dropbox-api-result'];
      var parsedData = safeJsonParse(_rawData);

      if (parsedData instanceof Error) {
        cb(parsedData);
      } else {
        cb(null, parsedData);
      }

      return;
    }

    var contentType = res.headers['content-type'];
    if (!isDownload && !/^application\/json/.test(contentType)) {
      res.resume();
      return cb(new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`));
    }

    res.setEncoding('utf8');
    var rawData = '';
    res.on('data', function (chunk) {
      rawData += chunk;
    });
    res.on('end', function () {
      var parsedData = safeJsonParse(rawData);

      if (parsedData instanceof Error) {
        cb(parsedData);
      } else {
        cb(null, parsedData);
      }
    });
  };
};

module.exports = function (opts, cb) {
  var headers = {
    'Authorization': 'Bearer ' + opts.token
  };

  if (opts.call !== 'download') {
    headers['Content-Type'] = 'application/octet-stream';
  }

  if (opts.args) {
    headers['Dropbox-API-Arg'] = saveJsonStringify(opts.args);
  }

  var req = got.stream.post(api[opts.call], {
    headers: headers
  });

  req.on('error', cb);
  req.on('response', parseResponse(cb, opts.call === 'download'));
  req.end(opts.data);
  return req;
};