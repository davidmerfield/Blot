var helper = require('../../../helper');
var callOnce = helper.callOnce;
var ensure = helper.ensure;
var time = helper.time;
var normalize = helper.pathNormalizer;

var Build = require('./single');
var Prepare = require('./prepare');
var Thumbnail = require('../../../thumbnail');

var DateStamp = require('./prepare/dateStamp');

var moment = require('moment');
             require('moment-timezone');

module.exports =  function (blog, path, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  callback = callOnce(callback);

  // Eventually we'll use this moment
  // to determine which builder the path
  // needs, e.g. an image, album etc...
  // path might need to change
  // for image captions, album items...

  Build(blog, path, function(err, html, metadata, stat){

    if (err) return callback(err);

    Thumbnail(blog, path, metadata, html, function(err, thumbnail){

      // Could be lots of reasons (404?)
      if (err || !thumbnail) thumbnail = {};

      var entry;

      // Given the properties above
      // that we've extracted from the
      // local file, compute stuff like
      // the teaser, isDraft etc..
      try {

        time('PREPARE');

        entry = {
          html: html,
          path: path,
          id: normalize(path),
          thumbnail: thumbnail,
          metadata: metadata,
          size: stat.size,
          dateStamp: DateStamp(blog, path, metadata),
          updated: moment.utc(stat.mtime).valueOf()
        };

        if (entry.dateStamp === undefined)
          delete entry.dateStamp;

        entry = Prepare(entry);

        time.end('PREPARE');

      } catch (e) {return callback(e);}

      return callback(null, entry);
    });
  });
};





// var album = require('./album');
// var isAlbum = album.is;
// var albumPath = album.path;
// var buildAlbum = album.build;

// var image =  require('./image');
// var isCaption = image.isCaption;
// var imagePath = image.imagePath;
// if (isCaption(path))
//   path = imagePath(path);

// For albums, we read the contents
// of each file in the directory
// then concatenate them. We must check
// this first since some albums have
// images inside them...
// if (isAlbum(path)) {

//   Build = buildAlbum;
//   path = albumPath(path);

// // For everything else...
// } else {

//   Build = buildSingle;
// }