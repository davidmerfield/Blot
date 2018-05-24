var helper = require('helper');
var forEach = helper.forEach;
var Dropbox = require('dropbox');
var delta = require('./delta');
var localPath = helper.localPath;
var Change = require('sync').change;
var download = require('./download');
var Sync = require('sync');
var Blog = require('blog');
var Database = require('../database');
var dropbox_content_hash = require('./dropbox_content_hash');

module.exports = function main (blogID, callback) {

  Blog.get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    Database.get(blogID, function(err, account){

      if (err) return callback(err);

      Sync(blog.id, function(callback) {

        delta(blogID, account, function handle (err, changes, has_more){

          if (err) return callback(err);

          forEach(changes, function(change, next){

            var path = change.path;
            var local_path = localPath(blog.id, path);
            var dropbox_path = change.path_display;
            var client = new Dropbox({accessToken: account.access_token});

            if (change['.tag'] === 'deleted') {
              return Change.drop(blog.id, path, next);
            }

            if (change['.tag'] === 'folder') {
              return Change.mkdir(blog.id, path, next);
            }

            if (change['.tag'] !== 'file') {
              console.log('I do not know what to do with this file');
              return next();
            }

            dropbox_content_hash(local_path, function(err, existing_hash){

              if (existing_hash && existing_hash === change.content_hash) {
                console.log('Blog:', blogID, change.path_display, "already has the same version stored locally. Do nothing.");
                return next();
              }

              download(client, dropbox_path, local_path, function(err){

                if (err) {
                  console.log(err);
                  return next();
                }

                Change.set(blog, path, function(err){

                  if (err) console.log(err);

                  next();
                });
              });
            });
          }, function(){

            // If Dropbox says there are more changes
            // we get them before returning the callback.
            // This is important because a rename could
            // be split across two pages of file events.
            if (has_more) {
              console.log('Blog:', blogID, "has more changes to sync!");
              return delta(blogID, account, handle);
            }

            callback();
          });
        });
      }, callback);
    });
  });
};