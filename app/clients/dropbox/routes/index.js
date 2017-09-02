var dashboard = require('express').Router();
var database = require('database');
var moment = require('moment');

dashboard.use(function(req, res, next){

  database.get(req.blog.id, function(err, account){

    if (err) return next(err);

    res.locals.account = req.account = account;

    if (account && account.valid !== 0) {
      res.locals.account.last_active = moment.utc(account.valid).fromNow();
    }

    return next();
  });
});

dashboard.get('/', function (req, res) {

  var error = req.query && req.query.error;

  if (error) res.locals.error = decodeURIComponent(error);

  res.dashboard('index');
});

dashboard.use('/disconnect', require('./disconnect'));
dashboard.use('/authenticate', require('./authenticate'));
dashboard.use('/select-folder', require('./select_folder'));

var site = require('express').Router();

site.use('/webhook', require('./webhook'));

module.exports = {
  site: site,
  dashboard: dashboard
};