var Dropbox = require('dropbox');
var database = require('database');
var router = require('express').Router();
var change_folder = router.route('/');
var fs = require('fs-extra');
var sync = require('./sync');
var helper = require('helper');
var localPath = helper.localPath;

change_folder.get(function(req, res, next) {

  var client = new Dropbox({accessToken: req.account.token});

  client.filesListFolder({path: '', recursive: true})
    .then(function(response){

      var folders = response.entries.filter(function(i){
        return i['.tag'] === 'folder';
      });

      folders.unshift({name: '/', path_display: '/'});

      folders = folders.map(function(i){
        i.root = '/Dropbox/Apps/Blot';
        if (i.path_display === req.account.root) i.checked = 'checked';
        return i;
      });

      res.locals.folders = folders;

      res.dashboard('change_folder');
    })
    .catch(function(err){
      next(err);
    });
});

change_folder.post(function(req, res, next){

  var account = {
    cursor: '',
    root: req.body.root
  };

  if (req.body.root && req.body.root === req.account.root)
    return res.redirect('/clients/dropbox');

  database.set(req.blog.id, account, function(err){

    if (err) return next(err);

    // readdir, for each file, remove entry

    fs.emptyDir(localPath(req.blog.id, '/'), function(err){

      sync(req.blog.id, function(){});

      res.redirect('/clients/dropbox');
    });
  });
});

module.exports = router;
