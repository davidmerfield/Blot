var debug = require("debug")("blot:models:entry:build");
var fs = require('fs');
var bplist = require('./bplist');
var helper = require('helper');
var ensure = helper.ensure;
var titlify = helper.titlify;
var LocalPath = helper.localPath;
var extname = require('path').extname;

var INVALID = 'Invalid webloc file';

function is (path) {
  return extname(path).toLowerCase() === '.webloc' || extname(path).toLowerCase() === '.url';
}

function extract (localPath, callback) {

  // First we attempt to parse the file as if it
  // were XML. This is the format used by Chrome and Firefox
  extractFromXML(localPath, function(err, url){

    if (url) return callback(null, url);

    // If this fails, we then try to parse the file
    // as if it were a Binary Plist file which is
    // the format used by Safari.
    extractFromBPlist(localPath, function(err, url){

      if (url) return callback(null, url);

      extractFromURL(localPath, function(err, url){

        if (url) return callback(null, url);

        return callback(new Error(INVALID));
      });
    });
  });
}

function extractFromURL (localPath, callback) {

  var url;

  fs.readFile(localPath, "utf-8", function (err, contents) {

    if (err)
      return callback(err);

    if (contents.indexOf('[InternetShortcut]') === -1 || contents.indexOf('URL=') === -1)
      return callback();

    try {

      url = contents.slice(contents.indexOf('URL=') + 'URL='.length).trim();

    } catch (e) {

      return callback(e);
    }

    return callback(null, url);
  });
}


function extractFromXML (localPath, callback) {

  var url;
  var reg = /<string>(.*)<\/string>/g;

  fs.readFile(localPath, "utf-8", function (err, contents) {

    if (err) return callback(err);

    try {

      url = reg.exec(contents)[1];

    } catch (e) {

      return callback(e);
    }

    return callback(null, url);
  });
}

function extractFromBPlist (localPath, callback) {

  var url;

  bplist.parseFile(localPath, function(err, obj) {

    if (err) return callback(err);

    try {

      url = obj[0].URL;

    } catch (e) {

      return callback(e);
    }

    return callback(null, url);
  });
}

function read (blog, path, options, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(options, 'object')
    .and(callback, 'function');

  var localPath = LocalPath(blog.id, path);
  var contents;

  fs.stat(localPath, function(err, stat){

    if (err) return callback(err);

    extract(localPath, function(err, url){

      if (err) return callback(err);

      if (!url) return callback(new Error(INVALID));

      contents = '<p><a href="' + url + '" class="bookmark">' + (titlify(options.name || '') || titlify(path)) + '</a></p>';

      callback(null, contents, stat);
    });
  });
}

module.exports = {is: is, read: read};