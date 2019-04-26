var debug = require("debug")("blot:helper:transformer");
var client = require("../../models/client");
var isURL = require("./isURL");
var Keys = require("./keys");
var HashFile = require("./hash");
var download = require("./download");
var ensure = require("../ensure");
var fs = require("fs-extra");
var localPath = require("../localPath");
var config = require("config");
var join = require("path").join;
var async = require("async");
var glob = require("fast-glob");

// TODO:
// Fix bug with transformer to handle ESOCKETIMEDOUT error...

function Transformer(blogID, name) {
  ensure(blogID, "string").and(name, "string");

  var keys = Keys(blogID, name);

  function lookup(src, transform, callback) {
    var url = isURL(src);
    var path = src;
    var fullLocalPath;
    var tasks = [];

    debug(src);

    // We check URLs first since isPath is less strict
    if (url) {
      debug(src, "seemes to be a URL");
      return fromURL(url, transform, callback);
    }

    if (path.length > 300) {
      return callback(new Error("Transformer: source too long: " + clip(src)));
    }

    if (path.indexOf("data:") === 0) {
      return callback(new Error("Transformer: source is unsupported protocol"));
    }

    // First we check if this path matches a file in the blog folder
    tasks.push(function(next) {
      fullLocalPath = localPath(blogID, path);
      fromPath(fullLocalPath, transform, next);
    });

    // Images pulled from Word Documents are stored in the static folder
    tasks.push(function(next) {
      fullLocalPath = join(config.blog_static_files_dir, blogID, src);
      fromPath(fullLocalPath, transform, next);
    });

    // Attempt to resolve the path case-insensitively in the blog directory
    // We don't need to check the static folder since those paths are
    // guaranteed correct and lowercase.
    tasks.push(function(then) {
      var options = {
        // Perform a case-insensitive match. Note: on case-insensitive
        // filesystems, non-magic patterns will match by default, since
        // stat and readdir will not raise errors.
        nocase: true,

        // The current working directory in which to search.
        cwd: localPath(blogID, "/").slice(0, -1),

        stats: false,

        // Do not match directories, only files. (Note: to match only
        //  directories, simply put a / at the end of the pattern.)
        onlyFiles: true,

        // Set to true to always receive absolute paths for matched files.
        // Unlike realpath, this also affects the values returned
        absolute: true
      };

      // Remove leading slash otherwise glob does not work
      if (path[0] === "/") path = path.slice(1);

      debug(path, "will be checked case-insensitively in", options.cwd);

      var stream = glob.stream([path, decodeURI(path)], options);
      var match = false;

      stream.on("data", function(file) {
        match = true;
        fromPath(file, transform, then);
      });

      stream.once("error", then);

      stream.once("end", function() {
        if (match) return;
        var err = new Error(
          "No file matches " + path + " in directory " + options.cwd
        );
        err.code = "ENOENT";
        return then(err);
      });
    });

    // Will work down the list of paths. If one of the paths
    // works then it'll stop and return the result!
    async.tryEach(tasks, function(err, results) {
      if (err) return callback(err);

      debug(results);

      callback(null, results[0], results[1]);
    });
  }

  // callback must be passed an error or null and result
  function fromURL(url, transform, callback) {
    ensure(url, "string")
      .and(transform, "function")
      .and(callback, "function");

    // Look in the database to see if we have downloaded
    // this URL in the past. If so, retrieve the response
    // headers, hash of the file's content and the result
    // application of the 'transform' called 'result'
    getURL(url, function(err, headers, hash, result) {
      if (err) return callback(err);

      // Now we try and download the URL, passing in previously
      // stored headers if any. This module interprets 304
      // responses nicely.
      download(url, headers, function(err, path, headers) {
        if (err) return callback(err);

        // We didn't redownload the file since it's
        if (!path && result) return callback(null, result);

        // Something went wrong, if there is no path, no error
        // and no result. So leave before breaking shit.
        if (!path && !result) return callback(missing(url));

        fromPath(path, transform, function(err, result, hash) {
          // The file was downloaded to the temp
          // directory so we remove it now...
          // do this before handling any errors...
          fs.remove(path);

          if (err) return callback(err);

          setURL(url, headers, hash, result, function(err) {
            if (err) throw err;

            callback(err, result);
          });
        });
      });
    });
  }

  function fromPath(path, transform, callback) {
    ensure(path, "string")
      .and(transform, "function")
      .and(callback, "function");

    debug(path, "hashing file");

    HashFile(path, function(err, hash) {
      if (err) return callback(err);

      debug(path, "getting existing result from hash");
      get(hash, function(err, result) {
        // Leave early, please pass hash so that
        // from URL doesn't have to compute it again
        if (err || result) return callback(err, result, hash);

        debug(path, "transforming new file");
        transform(path, function(err, result) {
          if (err) return callback(err);

          // Pass hash so that
          // from URL doesn't have to compute it again
          debug(path, "saving result of new transform");
          set(hash, result, function(err) {
            if (err) throw err;

            callback(err, result, hash);
          });
        });
      });
    });
  }

  function getURL(url, callback) {
    var info = [keys.url.headers(url), keys.url.content(url)];

    client.mget(info, function(err, res) {
      if (err) throw err;

      var headers = null;
      var hash = null;

      try {
        headers = JSON.parse(res[0]);
        hash = res[1];
      } catch (e) {}

      if (hash === null) return callback(err, headers, hash, null);

      get(hash, function(err, result) {
        callback(err, headers, hash, result);
      });
    });
  }

  function get(hash, callback) {
    client.get(keys.content(hash), function(err, stringifiedResult) {
      if (err) throw err;

      var res = null;

      try {
        res = JSON.parse(stringifiedResult);
      } catch (e) {}

      return callback(null, res);
    });
  }

  function setURL(url, headers, hash, result, callback) {
    callback = callback || nothing;

    ensure(url, "string")
      .and(headers, "object")
      .and(hash, "string")
      .and(result, "object")
      .and(callback, "function");

    var urlContentKey = keys.url.content(url);
    var urlHeadersKey = keys.url.headers(url);
    var contentKey = keys.content(hash);

    var stringifiedHeaders = JSON.stringify(headers);
    var stringifiedResult = JSON.stringify(result);

    client
      .multi()
      .sadd(keys.everything, contentKey, urlContentKey, urlHeadersKey)
      .mset(
        urlContentKey,
        hash,
        urlHeadersKey,
        stringifiedHeaders,
        contentKey,
        stringifiedResult
      )
      .exec(callback);
  }

  function set(hash, result, callback) {
    callback = callback || nothing;

    ensure(hash, "string")
      .and(result, "object")
      .and(callback, "function");

    var stringifiedResult = JSON.stringify(result);
    var contentKey = keys.content(hash);

    client
      .multi()
      .sadd(keys.everything, contentKey)
      .set(contentKey, stringifiedResult)
      .exec(callback);
  }

  function flush(callback) {
    client.smembers(keys.everything, function(err, keys) {
      client.del(keys, function() {
        callback();
      });
    });
  }

  return {
    lookup: lookup,
    flush: flush
  };
}

function nothing(err) {
  if (err) throw err;
}

function missing(src) {
  return new Error("Transformer: URL could not be downloaded: " + clip(src));
}

function clip(src) {
  if (src.length > 50)
    src =
      src.slice(0, 50) + "... (" + (src.length - 50) + " characters removed)";
  return src;
}

module.exports = Transformer;
