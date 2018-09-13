var database = require('../../database');
var mkdir = require('./mkdir');
var Dropbox = require('dropbox');
var async = require('async');

function readdir (client, path, callback) {

  client.filesListFolder({path: path})
    .then(function(res){
      if (!res) return callback(new Error('No response from Dropbox'));
      callback(null, res.entries);
    })
    .catch(callback);
}



function remove (client, path, callback) {
  client.filesDelete({
        path: path
      })
        .then(function(res){
          if (!res) return callback(new Error('No response from Dropbox'));
          callback(null);
        })
        .catch(function(err){

          // The file does not exist
          if (err.status === 409) return callback();

          callback(err);
        });
}
module.exports = function migrate_files (req, res, next) {

  // This could get tripped up if the blog's title
  // contains characters that are not valid in a dropbox
  // folder name. Perhaps we should handle this error?
  var new_account = req.new_account;
  var new_site_folder = '/' + req.blog.title;
  var existing_blog = req.existing_blog;
  var existing_site_folder = '/' + existing_blog.title;
  var client = new Dropbox({accessToken: new_account.access_token});

  readdir(client, '', function(err, contents){

    if (err) return next(err);

    async.each(contents, function(i, next){

      remove(client, i.path_display, next);

    }, function(){

      mkdir(client, existing_site_folder, function(err, existing_site_folder, existing_site_folder_id){

        if (err) return next(err);
      
        var updates = {
          folder: existing_site_folder,
          folder_id:  existing_site_folder_id,
          cursor: ''
        };

        database.set(existing_blog.id, updates, function(err){

          if (err) return next(err);

          mkdir(client, new_site_folder, function(err, folder, folder_id){

            if (err) return next(err);

            req.new_account.folder = folder;
            req.new_account.folder_id = folder_id;
            req.migration = existing_site_folder;
            req.migrated_folder = existing_site_folder;
            req.migrated_blog_id = existing_blog.id;
            
            return next();
          });
        });
      });
    });
  });
};