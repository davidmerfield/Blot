var dashboard = require('express').Router();
var database = require('database');
var moment = require('moment');

dashboard.use(function (req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/../views/' + name + '.html');
  };

  next();
});

dashboard.use(function(req, res, next){

  database.get(req.blog.id, function(err, account){

    if (err) return next(err);

    var last_sync = account && account.last_sync;
    var error_code = account && account.error_code;

    res.locals.account = req.account = account;

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