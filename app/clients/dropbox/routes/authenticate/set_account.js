var database = require('database');
var sync = require('../sync');

module.exports = function (req, res, next) {

  var account = req.new_account;

  database.set(req.blog.id, account, function(err){

    if (err) return next(err);

    sync(req.blog.id, function(){});

    res.redirect('/clients/dropbox');
  });
};