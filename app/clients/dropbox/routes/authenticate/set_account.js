var database = require('../../database');
var reset = require('sync').reset;
var sync = require('../sync');

module.exports = function (req, res, next) {

  var account = req.new_account;

  database.set(req.blog.id, account, function(err){

    if (err) return next(err);
    
    res.locals.account = account;
    res.message({new_folder: true, url: '/clients/dropbox', migration: req.migration});
    res.redirect('/clients/dropbox');

    // In future we can probably do better than a hard reset for
    // every case. We might not be changing the folder if we are
    // upgrading from partial to full folder permissions for instance.
    reset(req.blog.id, function(err){

      if (err) console.log('Blog:', req.blog.id, 'Reset error', err);

      sync(req.blog.id, function(err){

        if (err) console.log('Blog:', req.blog.id, 'Sync error', err);
      });
    });
  });
};