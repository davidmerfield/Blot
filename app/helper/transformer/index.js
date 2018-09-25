var client = require('../../models/client');
var isURL = require('./isURL');
var Keys = require('./keys');
var HashFile = require('./hash');
var download = require('./download');
var ensure = require('../ensure');
var rm = require('../remove');
var localPath = require('../localPath');
var config = require('config');
var join = require('path').join;

// This module allows us to transform
// a file to some arbritrary JSON object
// and persist that in the db. The file can
// exist on disk or at a URL. This module
// only applies the transformation function
// to the same file once.

// I use this module to upload images in blog
// posts, but to only upload the same image once.
// If it's already uploaded, this retrieves its
// url and dimensions from the database.
// As you can imagine, this massively speeds up
// saving existing entries, since images don't need
// to be reuploaded each time!

// TODO:
// Fix bug with transformer to handle ESOCKETIMEDOUT error...

function Transformer (blogID, name) {

  ensure(blogID, 'string')
    .and(name, 'string');

  var keys = Keys(blogID, name);

  function lookup (src, transform, callback) {

    ensure(src, 'string')
      .and(transform, 'function')
      .and(callback, 'function');

    var url, path;

    try {
      url = isURL(src);

      if (src.indexOf('/_image_cache/') === 0) {
        path = join(config.blog_static_files_dir, blogID, src);
      } else {
        path = localPath(blogID, src);
      }

      if (src.length > 300) path = false;
      if (src.indexOf('data:') === 0) path = false;

    } catch (e) {}

    // We check URLs first since isPath is less strict
    if (url)
      return fromURL(url, transform, callback);

    if (path)
      return fromPath(path, transform, callback);

    return callback(bad(src));
  }

  // callback must be passed an error or null and result
  function fromURL (url, transform, callback) {

    ensure(url, 'string')
      .and(transform, 'function')
      .and(callback, 'function');

    // Look in the database to see if we have downloaded
    // this URL in the past. If so, retrieve the response
    // headers, hash of the file's content and the result
    // application of the 'transform' called 'result'
    getURL(url, function(err, headers, hash, result){

      if (err) return callback(err);

      // Now we try and download the URL, passing in previously
      // stored headers if any. This module interprets 304
      // responses nicely.
      download(url, headers, function(err, path, headers){

        if (err) return callback(err);

        // We didn't redownload the file since it's
        if (!path && result) return callback(null, result);

        // Something went wrong, if there is no path, no error
        // and no result. So leave before breaking shit.
        if (!path && !result) return callback(missing(url));

        fromPath(path, transform, function(err, result, hash){

          // The file was downloaded to the temp
          // directory so we remove it now...
          // do this before handling any errors...
          rm(path);

          if (err) return callback(err);

          setURL(url, headers, hash, result, function(err){

            if (err) throw err;

            callback(err, result);
          });
        });
      });
    });
  }

  function fromPath (path, transform, callback) {

    ensure(path, 'string')
      .and(transform, 'function')
      .and(callback, 'function');

    HashFile(path, function(err, hash){

      if (err) return callback(err);

      get(hash, function(err, result){

        // Leave early, please pass hash so that
        // from URL doesn't have to compute it again
        if (err || result) return callback(err, result, hash);

        transform(path, function(err, result){

          if (err) return callback(err);

          // Pass hash so that
          // from URL doesn't have to compute it again
          set(hash, result, function(err){

            if (err) throw err;

            callback(err, result, hash);
          });
        });
      });
    });
  }

  function getURL (url, callback) {

    var info = [
      keys.url.headers(url),
      keys.url.content(url)
    ];

    client.mget(info, function(err, res){

      if (err) throw err;

      var headers = null;
      var hash = null;

      try {
        headers = JSON.parse(res[0]);
        hash = res[1];
      } catch (e) {}

      if (hash === null)
        return callback(err, headers, hash, null);

      get(hash, function(err, result){

        callback(err, headers, hash, result);
      });
    });
  }

  function get (hash, callback) {

    client.get(keys.content(hash), function(err, stringifiedResult){

      if (err) throw err;

      var res = null;

      try {
        res = JSON.parse(stringifiedResult);
      } catch (e) {}

      return callback(null, res);
    });
  }

  function setURL (url, headers, hash, result, callback) {

    callback = callback || nothing;

    ensure(url, 'string')
      .and(headers, 'object')
      .and(hash,'string')
      .and(result,'object')
      .and(callback,'function');

    var urlContentKey = keys.url.content(url);
    var urlHeadersKey = keys.url.headers(url);
    var contentKey = keys.content(hash);

    var stringifiedHeaders = JSON.stringify(headers);
    var stringifiedResult = JSON.stringify(result);

    client
      .multi()
      .sadd(keys.everything, contentKey, urlContentKey, urlHeadersKey)
      .mset(urlContentKey, hash, urlHeadersKey, stringifiedHeaders, contentKey, stringifiedResult)
      .exec(callback);
  }

  function set (hash, result, callback) {

    callback = callback || nothing;

    ensure(hash,'string')
      .and(result,'object')
      .and(callback,'function');

    var stringifiedResult = JSON.stringify(result);
    var contentKey = keys.content(hash);

    client
      .multi()
      .sadd(keys.everything, contentKey)
      .set(contentKey, stringifiedResult)
      .exec(callback);
  }

  function flush (callback) {
    client.smembers(keys.everything, function(err, keys){
      client.del(keys, function(){
        callback();
      });
    });
  }

  return {
    lookup: lookup,
    flush: flush
  };
}

function nothing (err){
  if (err) throw err;
}

function bad (src) {
  return new Error('Transformer: Identifier must be path or url: ' + clip(src));
}

function missing (src) {
  return new Error('Transformer: URL could not be downloaded: ' + clip(src));
}

function clip (src) {
  if (src.length > 50) src = src.slice(0, 50) + '... (' + (src.length - 50) + ' characters removed)';
  return src;
}

module.exports = Transformer;