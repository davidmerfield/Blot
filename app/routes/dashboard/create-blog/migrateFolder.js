var helper = require('../../../helper');
var User = require('../../../models/user');
var Blog = require('../../../models/blog');
var ensure = helper.ensure;
var forEach = helper.forEach.multi(10);
var joinpath = require('path').join;

module.exports = function (user, secondBlog, callback) {

  ensure(user, 'object')
    .and(secondBlog, 'object')
    .and(callback, 'function');

  // We pass the ID of their current blog
  // so migrateFolders can determine its handle
  // this is async but we don't care...
  if (user.blogs.length !== 1) return callback();

  var firstBlogID = user.blogs[0];

  Blog.get({id: firstBlogID}, function(err, firstBlog){

    if (err || !firstBlog) return callback(err || 'No first blog');

    var firstBlogFolder = '/' + firstBlog.handle;

    console.log('Blog:', firstBlogID + ':', 'Migrating folder to', firstBlogFolder);

    Blog.set(firstBlogID, {folder: firstBlogFolder}, function(err){

      if (err) return callback(err);

      User.makeClient(user.uid, function(err, client){

        if (err || !client) return callback(err || 'No client');

        var move = Move(client);

        client.readdir('/', function(err, stat, contents){

          if (err) return callback(err);

          contents = contents._json.contents;

          forEach(contents, function(item, next){

            var from = item.path;
            var to = joinpath(firstBlogFolder, from);

            move(from, to, next);

          }, function () {

            console.log('Blog:', firstBlogID + ':', 'Folder migration to', firstBlogFolder, ' is complete!');
            callback();
          });
        });
      });
    });
  });
};

var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503     // rate limit error
];

var INIT_DELAY = 100;
var MAX_ATTEMPTS = 10;

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

function Move (client) {

  return function (from, to, callback) {

    var delay = INIT_DELAY;
    var attempts = 1;

    client.move(from, to, function done (err){

      if (shouldRetry(err) && attempts < MAX_ATTEMPTS) {

        attempts++;
        delay *= 2;

        return setTimeout(function(){

          client.move(from, to, done);

        }, delay);
      }

      // there is already a file at this path
      if (err && err.status === 403) return callback();

      // the file was removed between the readdir and now...
      if (err && err.status === 404) return callback();

      if (err) console.log(err);

      callback();
    });
  };
}

