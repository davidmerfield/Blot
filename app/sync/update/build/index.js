var debug = require("debug")("blot:models:entry:build");
var Metadata = require("metadata");
var basename = require("path").basename;
var isDraft = require("../../../drafts").isDraft;

var Build = require("./single");
var Prepare = require("./prepare");
var Thumbnail = require("./thumbnail");

var DateStamp = require("./prepare/dateStamp");

var moment = require("moment");

module.exports = function (blog, path, options, callback) {

  Metadata.get(blog.id, path, function(err, name){

    if (err) return callback(err);

    if (name) options.name = name;
    
    debug("Blog:", blog.id, path, " checking if draft");
    isDraft(blog.id, path, function(err, is_draft) {
      if (err) return callback(err);

      debug("Blog:", blog.id, path, " attempting to build html");
      Build(blog, path, options, function(err, html, metadata, stat, dependencies) {
        if (err) return callback(err);

        debug("Blog:", blog.id, path, " extracting thumbnail");
        Thumbnail(blog, path, metadata, html, function(err, thumbnail) {
          // Could be lots of reasons (404?)
          if (err || !thumbnail) thumbnail = {};

          var entry;

          // Given the properties above
          // that we've extracted from the
          // local file, compute stuff like
          // the teaser, isDraft etc..

          try {
            entry = {
              html: html,
              name: options.name || basename(path),
              path: path,
              id: path,
              thumbnail: thumbnail,
              draft: is_draft,
              metadata: metadata,
              size: stat.size,
              dependencies: dependencies,
              dateStamp: DateStamp(blog, path, metadata),
              updated: moment.utc(stat.mtime).valueOf()
            };

            if (entry.dateStamp === undefined) delete entry.dateStamp;

            debug("Blog:", blog.id, path, " preparing additional properties for", entry.name);
            entry = Prepare(entry);
            debug("Blog:", blog.id, path, " additional properties computed.");
          } catch (e) {
            return callback(e);
          }

          // console.log('WARNING REMOVE THESE');
          //   if (entry.html.indexOf('status') > -1) {
          //     throw new Error('SIMULATE EXCEPTION');
          //   } else if (blog.handle === 'dev') {
          //     console.log('SIMULATE DELAY Waiting 10s.....');
          //     return setTimeout(function(){
          //       callback(null, entry);
          //     },10000);
          //   }

          callback(null, entry);
        });
      });
    });
  });
}

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
