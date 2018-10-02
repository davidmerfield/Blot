var fs = require('fs-extra');
var async = require('async');
var join = require('path').join;
var createClient = require('../util/createClient');
var debug = require('debug')('clients:dropbox:write_existing_contents');
var helper = require('helper');

// Dropbox doesn't let you delete the root folder so you must first
// list the contents inside the root folder then remove them individually
function empty_dropbox_folder (client, folder, callback) {

  debug('deleting', folder);

  client.filesListFolder({path: folder, include_deleted: false, recursive: false})
    .then(function(res){

      async.eachSeries(res.entries, function(entry, next){

        debug('deleting', entry.path_lower);

        // Could also use path_display but API is
        // case insensitive so it shouldn't matter
        client.filesDelete({path: entry.path_lower})
        
          .then(function(res){
              
            debug(res);

            next();

          }).catch(function(err){

            debug(err);

            next();
          });

      }, callback);
    })
    .catch(function(err){
      debug(err);
      callback();
    });

  
}

function write_files (client, paths_to_write, callback) {

  debug('starting to write files...');

  async.eachOfSeries(paths_to_write, function(local, remote, next){

    debug('reading', local);

    // Need to look up pretty path here...
    
    fs.readFile(local, function(err, contents){

      if (err) return callback(err);

      debug('writing', remote, local);

      client.filesUpload({
        contents: contents,
        autorename: false,
        mode: {'.tag': 'overwrite'},
        path: remote
      }).then(function(res){
        
        if (!res) {
          debug('No res from Dropbox');
        }

        next();

      }).catch(function(err){
        debug(err);
      });
    });

  }, callback);
}

function write_existing_contents (blogID, dropbox_folder, access_token, callback) {
    
  debug('made it to write_existing_contents');

  var client = createClient(access_token);
  var files_to_write = {};

  var dropbox_path = function (path) {
    return join(dropbox_folder, path); 
  };

  var local_path = function (path) {
    return helper.localPath(blogID, path);
  };

  var jobs = [
    iterate_folder.bind(this, '/'),
    empty_dropbox_folder.bind(this, client, dropbox_folder)
  ];

  async.eachSeries(jobs, function (job, nextJob){

    job(nextJob);

  }, function(){

    debug('back from delete');

    write_files(client, files_to_write, function(err){

      debug('back from write files');

      if (err) {

        return callback(err);
      }

      callback();
    });
  });

  function iterate_folder (folder_path, iterate_folder_callback) {

    debug('iterating', folder_path);

    fs.readdir(local_path(folder_path), function(err, contents){

      async.eachSeries(contents, function(item_name, next){

        debug('stating', local_path(join(folder_path, item_name)));

        fs.stat(local_path(join(folder_path, item_name)), function(err, stat){

          if (err) return iterate_folder_callback(err);

          if (stat.isDirectory()) {
            return iterate_folder(join(folder_path, item_name), next);
          }

          files_to_write[dropbox_path(join(folder_path, item_name))] = local_path(join(folder_path, item_name));
          next();
        });

      }, iterate_folder_callback);
    });
  }
}

module.exports = function (req, res, next){

  var jobs = [];

  if (req.new_account) {
    jobs.push(write_existing_contents.bind(
      this,
      req.blog.id,
      req.new_account.folder,
      req.new_account.access_token
    ));
  }

  if (req.migration) {  
    jobs.push(write_existing_contents.bind(
      this,
      req.migrated_blog_id,
      req.migrated_folder,
      req.new_account.access_token      
    ));
  }

  async.eachSeries(jobs, function(job, nextJob){

    job(nextJob);
  
  }, next);
};
