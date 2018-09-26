var ensure = require('../../ensure');

var request = require('request');
var fs = require('fs');
var writeStream = fs.createWriteStream;
var UID = require('../../makeUid');
var callOnce = require('../../callOnce');
var tempDir = require('../../tempDir')();
var nameFrom = require('../../nameFrom');
var tidy = require('./tidy');
var invalid = require('./invalid');

var IF_NONE_MATCH = "If-None-Match";
var IF_MODIFIED_SINCE = "If-Modified-Since";
var LAST_MODIFIED = 'last-modified';
var CACHE_CONTROL = 'cache-control';

var MAX_REDIRECTS = 5; // prevent event emitter leak...
var TIMEOUT = 5000; // 5s

var debug = function(){}; // console.log ||

module.exports = function (url, headers, callback) {

  // Verify the url has a host, and protocol
  if (invalid(url)) return callback(new Error('Invalid URL ' + url));

  // Sometimes these are null for new urls...
  headers = headers || {};

  ensure(url, 'string')
    .and(headers, 'object')
    .and(callback, 'function');

  // The expire date is greater than now!
  // We don't need to download anything.
  if (isFresh(headers)) return callback();

  var file, download, path, options;

  callback = callOnce(callback);

  path = tempDir + UID(6) + '-' + nameFrom(url);

  options = {
    headers: {'user-agent': 'node-request'},
    maxRedirects: MAX_REDIRECTS,
    timeout: TIMEOUT,
    url: url
  };

  if (headers && headers.etag)
    options.headers[IF_NONE_MATCH] = headers.etag;

  if (headers && headers[LAST_MODIFIED])
    options.headers[IF_MODIFIED_SINCE] = headers[LAST_MODIFIED];

  debug('Downloading', url, 'to', path, 'with request headers:');
  debug(print(options.headers));

  file = writeStream(path);

  file.on('error', done)
      .on('finish', file.close);

  download = request.get(options)
    .on('response', onResponse)
    .on('error', done)
    .on('end', done);

  download.pipe(file);

  function onResponse (res) {

    debug('Recieved response:');

    if (!res || !res.statusCode){
      debug('  it is empty or without status code');
      return callback(new Error('No response'));
    }

    if (res.headers) {

      var cacheControl = res.headers[CACHE_CONTROL];
      var lastModified = res.headers[LAST_MODIFIED];
      var expires = res.headers.expires;

      // etags sometimes have " inside a string
      // dont remove these or it wont work...
      var etag = res.headers.etag;

      headers[LAST_MODIFIED] = lastModified || headers[LAST_MODIFIED] || '';
      headers.etag = etag || headers.etag || '';
      headers.expires = tidy.date(expires) || tidy.expire(cacheControl) || headers.expires || '';

      debug('  updated latest reponse headers for status', res.statusCode);
    }

    if (res.statusCode === 304){
      debug('  it has 304 unchanged status');
      stop();
      return done();
    }

    // can we make this play nicely with redirects?
    if (res.statusCode < 200 || res.statusCode >= 300) {
      debug('  it has a bad status code:', res.statusCode);
      return done(new Error(res.statusCode));
    }
  }

  function stop () {


    debug('Aborting download and removing', path);

    download.abort();

    // we reset the path since the
    // download was stopped, there is no local file.
    // do nothing don't care if this errors
    try {
      fs.unlink(path, function(err){
        if (err) debug(err);
      });
    } catch (e) {}

    path = null;
  }

  function done (err) {

    if (err) stop();

    debug('Calling back with path', path, 'and res headers:');
    debug(print(headers));

    return callback(err, path, headers);
  }
};

function isFresh (existing) {
  return existing && existing.url && existing.expires && existing.expires > Date.now();
}

function print (obj) {
  var res = '';
  for (var i in obj) {
    if (res) res += '\n';
    res += '  ' + i + ': "' + obj[i] + '"';
  }
  return res;
}