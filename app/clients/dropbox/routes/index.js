var dashboard = require('express').Router();
var database = require('database');
var moment = require('moment');
var forEach = require('helper').forEach;
var Dropbox = require('dropbox');
var sync = require('./sync');

dashboard.use(function (req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/../views/' + name + '.html');
  };

  next();
});

dashboard.use(function(req, res, next){

  var existing_accounts = [];
  var existing_account_ids = [];
  var current_account;

  forEach(req.user.blogs, function(blogID, nextBlog){

    database.get(blogID, function(err, account){
      
      if (err) return next(err);

      if (!account) return nextBlog();

      if (blogID === req.blog.id) {
        current_account = account;
      } else if (existing_account_ids.indexOf(account.account_id) > -1) {
        return nextBlog();
      } else {
        account.blog = blogID;
        existing_accounts.push(account);    
        existing_account_ids.push(account.account_id);
      }

      nextBlog();
    });

  }, function(){

    var last_sync = current_account && current_account.last_sync;
    var error_code = current_account && current_account.error_code;

    res.locals.account = req.account = current_account;
    res.locals.existing_accounts = existing_accounts;

    if (last_sync) {
      res.locals.account.last_sync = moment.utc(last_sync).fromNow();
    }

    if (error_code) {
      res.locals.account.folder_missing = error_code === 409;
      res.locals.account.revoked = error_code === 401;
    }

    return next();
  });
});

dashboard.get('/', function (req, res) {

  if (!req.blog.client) return res.redirect('/clients');

  var error = req.query && req.query.error;

  if (error) res.locals.error = decodeURIComponent(error);

  res.dashboard('index');
});

function filesGetMetadata (client, folder_id, callback) {

  client.filesGetMetadata({path: folder_id})
    .then(callback.bind(this, null))
    .catch(callback);

}



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

dashboard.post('/select-folder', function (req, res, next) {
  
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

        res.redirect(req.baseUrl);

        sync(req.blog.id, function(){});
      }); 
    });
  });
});

dashboard.get('/select-folder', function (req, res, next) {

  database.get(req.blog.id, function(err, account){

    if (err) return next(err);

    var client = new Dropbox({accessToken: account.access_token});

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

        res.dashboard('select_folder');
      });
    });
  });
});

function list_candidate_folders (client, callback) {

  // Dropbox API prefers the root folder specified as an empty
  // string. Otherwise it returns an error.
  client.filesListFolder({path: '', include_deleted: false, recursive: false})
    .then(callback.bind(this, null))
    .catch(callback);

}


dashboard.use('/disconnect', require('./disconnect'));
dashboard.use('/authenticate', require('./authenticate'));

dashboard.use('/full-folder', function(req, res){
  res.dashboard('full_folder');
});

dashboard.use('/different-dropbox', function (req, res) {
  res.dashboard('different_dropbox');
});

var site = require('express').Router();

site.use('/webhook', require('./webhook'));

module.exports = {
  site: site,
  dashboard: dashboard
};