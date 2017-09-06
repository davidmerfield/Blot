var database = require('database');
var sync = require('../sync');
var fs = require('fs-extra');

module.exports = function (req, res, next) {

  var account = req.new_account;

  database.set(req.blog.id, account, function(err){

    if (err) return next(err);

    res.locals.account = account;

    res.message({new_folder: true, url: '/clients/dropbox', migration: req.migration});
    res.redirect('/clients/dropbox');

    // we also need to delete all the posts
    fs.emptyDir(localPath(req.blog.id), function(err){

      sync(req.blog.id, function(){});

    });
  });
};