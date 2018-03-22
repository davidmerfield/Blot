var Buffer = require('safe-buffer').Buffer;
var basename = require('path').basename;
var on_headers = require('on-headers');
var join = require('path').join;
var uuid = require('uuid/v1');
var fs = require('fs-extra');
// var debug = console.log;
// require('debug');

// Regex to check the Cache-Control header to
// determine if the response should not be cached.
var NO_CACHE_REGEX = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;

// Header strings
var CACHE_CONTROL = 'Cache-Control';
var CONTENT_TYPE = 'Content-Type';

// Error messages
var NO_DIRECTORY = 'Please specify a cache directory';

module.exports = function (cache_directory) {

  var tmp_directory;

  if (!cache_directory) throw new Error('Pass a cache directory');

  // Ensure the temp directory exists
  tmp_directory = join(cache_directory, '.tmp');
  fs.ensureDirSync(tmp_directory);

  return function disk_cache (req, res, next){

    var called_end = false;
    var stream, final_path, tmp_path, tmp_name;
    var content_type, cache_control, has_max_age, cache_age;
    var _write = res.write;
    var _end = res.end;
    
    var debug = console.log.bind(this, req.baseUrl + req.path);

    res.write = function (chunk, encoding) {

      debug('write called', chunk, encoding);

      // Trigger the onHeaders function below
      // if we have not set any headers ourselves
      if (!this._header) this._implicitHeader();

      // We only write to the file stream if it
      // exists and if we have not triggered the
      // called_end flag in our custom end function
      // below. This prevents a 'double write'
      // when calling end with a final chunk. 
      // I don't understand why this flag isn't
      // needed when calling the original _write
      if (!called_end && stream) stream.write(Buffer.from(chunk, encoding));

      // The return value of response.write is
      // meaningful and tells 
      // I believe it dictates whether or not the stream
      // is ready to be written too again. So we need to return it
      // here. Don't move it without accounting for this.
      return _write.call(this, chunk, encoding);
    };

    res.end = function (chunk, encoding) {

      debug('end called', chunk, encoding);
      
      // This flag is used to prevent a 'double write'
      // if response.end is invoked with a chunk of data
      // You can end a writeable stream with or without 
      // some final piece of data. Calling res.end
      // with a final piece of data neccessarily invokes
      // res.write afterwards for a reason I don't 
      // quite yet understand, so we set this flag to allow
      // our res.write function not to write the data a second time
      called_end = true;
      
      // Triggers the onHeaders function below
      // if we have not set any headers ourselves
      if (!this._header) this._implicitHeader();

      // We need to create a buffer from the data 
      // chunk passed to response.end. I'm not sure exactly
      // why but it's what the compression middleware does.
      if (chunk && stream) {
        stream.end(Buffer.from(chunk, encoding));
      } else if (stream) {
        stream.end();
      }

      // Again, like res.write, the return value of the end 
      // function is meaningful so don't move this elsewhere
      return _end.call(this, chunk, encoding);
    };

    // We can only determine whether the response
    // is cacheable when the headers are sent.
    on_headers(res, function onResponseHeaders () {

      // Don't cache requests with sessions. This prevents
      // sensitive data from appearing in the site's cache.
      if (req.session && req.session.uid) {
        debug('has session');
        return;
      } 
      
      // Check if the response has the no-cache header set
      // Don't cache the response if so!
      if (no_cache(req, res)) {
        debug('no cache');
        return;
      }

      // Only cache GET requests. We probably don't want to cache
      // POST or HEAD requests, ever.
      if (req.method !== 'GET') {
        debug('Non-GET request');
        return;
      } 

      // Don't cache 404 pages or other error pages
      // Doing so would neccessitate storing the correct status
      // code for the cache to send which needlessly complicates it.
      if (res.statusCode !== 200) {
        debug('BAD status ' + req.originalUrl + ' ' + res.statusCode);
        return;
      }

      // Ignore any URLs with query strings. This is because
      // when we save the file to disk, the query string ought to be included.
      // However, when we do this, NGINX can't determine the correct mimetype 
      // for a file like /cache/example.com/style.css?foo=123 because its file
      // extension is 'css?foo=123' I should look into whether it is possible
      // to cofigure NGINX around this, using say REGEX. But unsure for now.
      if (Object.keys(req.query).length) {
        debug('Has query string');
        return;        
      }

      // I would like to create the neccessary directorys to write the
      // response to disk at its final path, but I don't know how to do this asynchronously.
      // When I tried, it didn't pipe the stream properly. I will work out how
      // to do this eventually. For now, just create a new file inside the temp directory.
      tmp_name = uuid() + basename(req.baseUrl + req.path);
      tmp_path = join(tmp_directory, tmp_name);

      // Initiate the stream to the location we'll
      // write the response to this request.
      stream = fs.createWriteStream(tmp_path);

      // I suspect this catches an error which results when you flush the 
      // cache for a given site, whilst caching the response to a request to 
      // a page on the site. Allow a sudden, the file to which the stream
      // points will no longer exist. There are probably other errors here too.
      stream.on('error', function(err){
        debug(err);
        stream.close();
      });

      // This fires once res.end has been called, signifying
      // all the data has been written to the response.
      // Now we can move the temporary file to its final location. 
      stream.on('finish', function onStreamEnd () {
          
        debug('stream has finished');

        stream.close();
        
        content_type = res.getHeader(CONTENT_TYPE);
        cache_control = res.getHeader(CACHE_CONTROL);
        has_max_age = cache_control && cache_control.indexOf('max-age') > -1;
        cache_age = has_max_age ? 'permanent' : 'temporary';

        // We create a directory structure to make life as simple as
        // possible for try_files in NGINX.
        // final example path is something like this for example.com/about:
        // /cache/example.com/https/temporary/about/index.html
        final_path = join(
          cache_directory,
          req.hostname, // hostname allows the static file server to 
          req.protocol, // protocol to allow us to preserve HTTP -> HTTPS redirects
          cache_age, // cache_age, either permanent or temporary
          req.originalUrl
        );

        // Determine if we should create a subdirectory containing an index
        // file for this request. Maps requests to /about to /about/index.html
        if (needs_index(content_type, req.path))  {
          final_path = join(final_path, 'index.html');
        }

        // Now we have all the time in the world to move the temporary file
        // containing the full, successfully-sent response to this request.
        fs.move(tmp_path, final_path, {overwrite: true}, function(err){

          if (!err) return;  // We moved the file successfully

          // We encountered some file system error moving the temp
          // file to its final location in the cache directory. 
          // Remove the temporary output and go on with our lives.
          debug(err);
          fs.remove(tmp_path, function(err){

            // Nothing else we can really do here
            if (err) debug(err);
          });
        });  
      });
    });
    next();
  };
};

// Don't compress for Cache-Control: no-cache
function no_cache (req, res) {

  var cache_control = res.getHeader('Cache-Control');
    
  // There is no cache control header set, so we default
  // to allowing it.
  if (!cache_control) return false;

  return NO_CACHE_REGEX.test(cache_control);
}

function needs_index (content_type, path) {
  return content_type && content_type.indexOf('text/html') > -1 && path.indexOf('.') === -1;
}
