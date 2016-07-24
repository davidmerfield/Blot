var helper = require('../../app/helper');
var forEach = helper.forEach.multi(5);
var get = require('./get');
var mkdirp = helper.mkdirp;

var handle = process.argv[2],
    p = require('path'),
    downloadsDir = p.resolve(__dirname + '/../../tmp/downloads');

var download = require('../../app/sync/dropbox/change/download');

var fs = require('fs');

// Ensure tmp dir exists
if (!fs.existsSync(downloadsDir)) {
    console.log('Made temporary file directory');
    fs.mkdirSync(downloadsDir);
}

// console.log(downloadsDir);

if (!handle) throw 'pass a handle';


var blogDir = downloadsDir + '/' + handle + '-' + Date.now();

console.log('file://' + blogDir);

get(handle, function (user, blog, client){

  fetch(blog.folder, function(){
    console.log('All done!');
  });

  function fetch (dir, done) {

    mkdirp(blogDir + dir, function(err){

      if (err) throw err;

      client.readdir(dir, function(err, stat, foo){

        if (err) console.log(err);

        var contents = foo._json.contents;

        // console.log(contents);

        // console.log(contents);

        forEach(contents, function(file, next){

          if (file.is_dir)
            return fetch(file.path, next);

          console.log(file.path);

          download(client, file.path, blogDir + file.path, next);
        }, done);
      });
    });
  }
});
