
var Metadata = require('../../../models/metadata');
var readdir = Metadata.readdir;

var stat = require('./stat');
var dirname = require('path').dirname;

var helper = require('../../../helper');
var forEach = helper.forEach;

var stat = require('./stat');

function dir (blog, dir, callback) {

  var blogID = blog.id;
  var files = [];

  readdir(blogID, dir, function(err, contents, dir){

    if (err && err.code === 'ENOTDIR') {

      return stat(blog, dir, function(err, stat){

        if (err) return callback(err);

        readdir(blogID, dirname(dir), function(err, contents, dir){

          callback(err, [], dir, stat);
        });
      });
    }

    if (err) return callback(err);

    forEach(contents, function(item, nextName){

      stat(blog, item.path, function(err, stat){

        if (err) console.log(err);

        if (err) return nextName();

        stat.name = item.name;
        stat.path = item.path;

        files.push(stat);
        nextName();
      });

    }, function(){


      callback(null, files, dir);
    });
  });
}

module.exports = dir;