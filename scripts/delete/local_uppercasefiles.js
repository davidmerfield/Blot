var eachBlog = require('./each/blog');

var helper = require('../app/helper');
var forEach = helper.forEach;
var localPath = helper.localPath;
var ensure = helper.ensure;
var rm = helper.remove;
var fs = require('fs');
var joinPath = require('path').join;
var basename = require('path').basename;

var log = require('single-line-log').stdout;

eachBlog(function(user, blog, nextBlog) {

  ensure(user, 'object')
    .and(blog, 'object')
    .and(nextBlog, 'function');

  console.log();
  console.log('--------', blog.id, user.name);

  var checkDir = CheckDir(blog.id);

  checkDir('/', function(){

    log('✔ All paths checked');
    return nextBlog();
  });

}, process.exit);

function CheckDir (blogID) {

  return function check (dir, callback) {

    var localDir = localPath(blogID, dir);

    fs.readdir(localDir, function(err, contents){

      if (err) throw err;

      forEach(contents, function(name, next){

        if (name === '.DS_Store')
          return next();

        var path = joinPath(localDir, name);

        fs.stat(path, function (err, stat) {

          if (err) throw err;

          var normalizedName = basename(localPath(blogID, name));

          if (normalizedName === name && stat.isDirectory()) {
            return check(joinPath(dir, name), next);
          }

          if (normalizedName === name) {
            log('✔ ' + path);
            return next();
          }

          // it's not
          rm(path, function(err){

            if (err) throw err;

            console.log('\n !!! Removed', path);
            return next();

          });
        });
      }, callback);
    });
  };
}