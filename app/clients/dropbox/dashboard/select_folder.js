var Express = require('express');
var select_folder = Express.Router();
var helper = require('helper');
var forEach = helper.forEach;
var database = require('../database');
var Dropbox = require('dropbox');

function get_accounts (blogIDs, callback) {

  var accounts = [];

  forEach(blogIDs, function(blogID, nextBlog){

    database.get(blogID, function(err, account){
      
      if (err) return callback(err);

      if (!account) return nextBlog();

      accounts.push(account);

      nextBlog();
    });
  }, function(){
    callback(null, accounts);
  });
}


function filesGetMetadata (client, folder_id, callback) {

  client.filesGetMetadata({path: folder_id})
    .then(callback.bind(this, null))
    .catch(callback);

}


function list_candidate_folders (client, callback) {

  // Dropbox API prefers the root folder specified as an empty
  // string. Otherwise it returns an error.
  client.filesListFolder({path: '', include_deleted: false, recursive: false})
    .then(callback.bind(this, null))
    .catch(callback);

}

select_folder.route('/').get(function (req, res, next) {

  if (!req.account.error_code) return res.redirect('/clients/dropbox');

  var client = new Dropbox({accessToken: req.account.access_token});

  list_candidate_folders(client, function(err, contents){

    if (err) return next(err);

    contents = contents.entries.map(function(item){
      item.folder = item['.tag'] === 'folder';
      return item;
    });

    forEach(req.user.blogs, function(blogID, nextBlog){

      if (blogID === req.blog.id) return nextBlog();

      database.get(blogID, function(err, other_account){
        
        if (err || !other_account) return nextBlog();

        contents.forEach(function(folder){

          if (other_account.folder_id === folder.id)
            folder.in_use = true;
        });

        nextBlog();
      });

    }, function(){

      res.locals.items = contents;

    res.render(__dirname + '/views/select_folder.html');
    });
  });
});

select_folder.route('/').post(function (req, res, next) {
    
  if (!req.account.error_code) return res.redirect('/clients/dropbox');

  var folder_id = req.body.folder_id;

  if (!folder_id) return next(new Error('Please specify a folder.'));

  if (typeof folder_id !== 'string') return next(new Error('Please pass a valid folder'));

  var changes = {
    folder_id: folder_id,
    cursor: '',
    error_code: 0
  };

  var client = new Dropbox({accessToken: req.account.access_token});

  get_accounts(req.user.blogs, function(err, accounts){

    var existing_folder_ids = accounts.map(function(account){
      return account.folder_id;
    });

    if (existing_folder_ids.indexOf(folder_id) > -1) return next(new Error('Already in use'));

    filesGetMetadata(client, folder_id, function(err, metadata){

      if (err) return next(err);
        
      changes.folder = metadata.path_display;
      
      database.set(req.blog.id, changes, function(err){

        if (err) return next(err);

        res.redirect('/clients/dropbox');
      }); 
    });
  });
});

module.exports = select_folder;