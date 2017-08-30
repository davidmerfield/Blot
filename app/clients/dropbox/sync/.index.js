var helper = require('helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var buildFromFolder = require('../../../modules/template').update;
var delta = require('./delta');
var Blog = require('blog');
var Dropbox = require('dropbox');
var Change = require('./change');

var NO_CREDENTIALS = 'This blog not not have Dropbox credentials';

module.exports = function (blogID, options, callback) {

  ensure(blogID, 'string')
    .and(options, 'object')
    .and(callback, 'function');

  var accessToken, client, cursor;

  Blog.get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    cursor = options.hard ? '' : blog.dropbox.cursor;
    accessToken = blog.dropbox.token;

    if (!accessToken) return callback(new Error(NO_CREDENTIALS));

    client = new Dropbox({accessToken: accessToken});

    delta(client, cursor, function(err, changes, latest_cursor){

      if (err) return callback(err);

      forEach(changes, function(change, next){

        Change(blog, client, change, function (err) {

          if (err) {
            console.log('Error processing change for path', change.path_display);
            console.log(err);
            console.log(err.message);
            console.log(err.stack);
            console.log(err.trace);
          }

          next();
        });
      }, function(){

        buildFromFolder(blog.id, function(err){

          if (err) return callback(err);

          blog.dropbox.cursor = latest_cursor;

          Blog.set(blogID, blog, function(err){

            if (err) return callback(err);

            // No we make sure that the changes
            // from dropbox conform to what we expect
            // There was a bug where json.parse(json.string(change))
            // was not equal to the change. so we do this in advance
            callback(null, changes);
          });
        });
      });
    });
  });
};