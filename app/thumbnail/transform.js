var helper = require('../helper');
var callOnce = helper.callOnce;
var ensure = helper.ensure;
var forEach = helper.forEach.parallel;
var basename = require('path').basename;

var fs = require('fs');
var readStream = fs.createReadStream;

var sharp = require('sharp');

// https://github.com/lovell/sharp/issues/138
// sharp.concurrency(2);

// Sharp seems to cache files based on their 
// path and not the contents of the file at 
// a particular path. It was returning stale
// versions of a file in the blog's folder. 
// Perhaps it might be smarter to copy the file
// to the temporary directory before operating on it?
// It's also possible that this is a bug in Sharp's
// caching that has been fixed in a more recent version
// or that still needs to be fixed. I should investigate.
sharp.cache(false);


// Not sure why I commented this out? Shit
// https://github.com/lovell/sharp/issues/349
// https://github.com/lovell/sharp/issues/315
// sharp.cache(false);

var thumbnails = {
  small: {size: 160},
  medium: {size: 640},
  large: {size: 1060},
  square: {size: 160, crop: true}
};

function main (path, destination, callback) {

  ensure(path, 'string')
    .and(destination, 'string')
    .and(callback, 'function');

  callback = callOnce(callback);

  var read = readStream(path);
  var input = sharp();

  var result = {};
  var created = [];

  // Handle ENOENT, EISDIR etc...
  // this will remove all the files
  // we'll have created below...
  read.on('error', function(err){
    forEach(created, fs.unlink, function(){
      callback(err);
    });
  });

  read.pipe(input);

  forEach(thumbnails, function(name, options, next){

    var to = destination + '/' + name + '-' + basename(path);

    created.push(to);

    transform(input, to, options, function(err, info){

      if (err) return callback(err);

      result[name] = info;

      next();
    });
  }, function(){

    callback(null, result);
  });
}

function transform (input, to, options, callback) {

  ensure(options, 'object')
    .and(callback, 'function');

  callback = callOnce(callback);

  var size = options.size;

  // need to update vips
  // .trellisQuantisation()

  // doesnt seem to do anything
  // .compressionLevel(9)

  var transform = input
        .clone()
        .withoutEnlargement()
        .rotate(); // try to auto rotate
        // we need to reset quality
        // .quality(100); // don't compress, we'll do that later

  transform.on('error', done);

  transform.resize(size, size);

  if (options.crop) {

    transform.crop(sharp.strategy.entropy);

  } else {

    transform.max();
  }

  function done (err, info){

    if (err) {
      fs.unlink(to, function(){});
      return callback(err);
    }

    var response = {
      path: to,
      width: info.width,
      height: info.height
    };

    callback(err, response);
  }

  transform.toFile(to, done);
}

module.exports = main;