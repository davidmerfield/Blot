var Dropbox = require('dropbox');
var database = require('database');
var fs = require('fs-extra');
var sync = require('./sync');
var helper = require('helper');
var localPath = helper.localPath;
var forEach = require('helper').forEach;
var router = require('express').Router();
var select_folder = router.route('/');

function other_accounts (req, res, next) {

  var new_account = req.session && req.session.new_account;
  var account = new_account || req.account;

  if (!account)
    return next(new Error('You need an account'));

  database.get_blogs_by_account_id(account.account_id, function(err, blogs){

    if (err) return next(err);

    var other_accounts = [];

    forEach(blogs, function(blog, next_blog){

      if (blog.id === req.blog.id) return next_blog();

      database.get(blog.id, function(err, account){

        if (err) return next(err);

        other_accounts.push(account);

        next_blog();
      });

    }, function(){

      req.other_accounts = other_accounts;
      return next();
    });
  });
}

select_folder.get(other_accounts, function(req, res, next) {

  var new_account = req.session && req.session.new_account;
  var account = new_account || req.account;

  console.log('ACCOUNT', account.full_access, req.other_accounts.length);

  if (account.full) {

    var client = new Dropbox({accessToken: account.access_token});

    client.filesListFolder({path: '', recursive: true})
      .then(function(response){

        var folders = response.entries.filter(function(i){
          return i['.tag'] === 'folder';
        });

        res.locals.folders = folders;
        res.dashboard('select_folder');
      })
      .catch(function(err){
        next(err);
      });

    return;
  }

  if (req.other_accounts.length === 0)
    return res.redirect(req.baseUrl);

  res.locals.move = req.other_accounts.length === 1;
  res.dashboard('select_folder');
});

select_folder.post(function(req, res, next){

  var new_account = req.session && req.session.new_account;
  var account = new_account || req.account;
  var folder = req.body.folder;

  folder = JSON.parse(folder);

  // you should not be able to choose the root directory
  // if there are more than one blog connected to this db account

  account.folder_id = folder.id;
  account.folder = folder.path;
  account.cursor = '';
  account.error_code = 0;

  database.set(req.blog.id, account, function(err){

    if (err) return next(err);

    delete req.session.new_account;

    // readdir, for each file, remove entry

    fs.emptyDir(localPath(req.blog.id, '/'), function(err){

      sync(req.blog.id, function(){});

      res.redirect('/clients/dropbox');
    });
  });
});

module.exports = router;
