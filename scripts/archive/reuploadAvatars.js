var options = require('minimist')(process.argv.slice(2));
var eachBlog = require('./each/blog');
var fs = require('fs');
var writeStream = fs.createWriteStream;
var request = require('request');
var upload = require('../app/upload');
var helper = require('../app/helper');
var nameFrom = helper.nameFrom;
var UID = helper.makeUid;
var tempDir = helper.tempDir();
var Blog = require('../app/models/blog');

eachBlog(function (user, blog, next) {

  console.log(blog.handle);

  if (!blog.avatar) return next();

  var url = blog.avatar;

  if (url.indexOf('//') === 0) url = 'https:' + url;

  var path = tempDir + UID(6) + '-' + nameFrom(url);

  console.log(url);

  download(url, path, function(err){

    if (err) throw err;

    console.log(path);

    upload(path, {blogID: blog.id, folder: 'avatars'}, function(err, newUrl){

      if (err) throw err;

      if (!newUrl) throw 'No url';

      fs.unlink(path, function(err){

        if (err) throw err;

        if (newUrl.indexOf('//') !== 0) throw newUrl;

        newUrl = 'https:' + newUrl;

        Blog.set(blog.id, {avatar: newUrl}, function(err){

          if (err) throw err;

          console.log(newUrl);
          console.log();

          next();
        });
      });
    });
  });
}, process.exit, options);

function download (url, path, callback) {

  var download;
  var options = {uri: url};

  var file = writeStream(path);

  file.on('error', callback)
      .on('finish', file.close);

  download = request.get(options)
    .on('error', callback)
    .on('end', callback);

  download.pipe(file);

}