var join = require('path').join;
var database = require('../../database');
var moment = require('moment');

module.exports = function load_dropbox_account (req, res, next) {

  database.get(req.blog.id, function(err, account){
    
    if (err) return next(err);

    if (!account) return next();

    var last_sync = account.last_sync;
    var error_code = account.error_code;

    res.locals.account = req.account = account;

    if (last_sync) {
      res.locals.account.last_sync = moment.utc(last_sync).fromNow();
    }

    if (error_code) {
      res.locals.account.folder_missing = error_code === 409;
      res.locals.account.revoked = error_code === 401;
    }

    var breadcrumbs = [];
    var folder;
      
    if (res.locals.account.full_access) {

      folder = join('Dropbox', res.locals.account.folder);

    } else {

      folder = join('Dropbox', 'Apps', 'Blot', res.locals.account.folder);

    }

    breadcrumbs = folder.split('/').map(function(name){
      return {name: name};
    });

    breadcrumbs[breadcrumbs.length -1].last = true;
    res.locals.breadcrumbs = breadcrumbs;

    return next();
  });
};