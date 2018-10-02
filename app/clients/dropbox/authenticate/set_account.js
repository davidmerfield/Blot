var database = require('../database');

module.exports = function (req, res, next) {

  var account = req.new_account;

  database.set(req.blog.id, account, function(err){

    if (err) return next(err);
    
    res.locals.new_folder = true;
    res.locals.account = account;
    
    next();
  }); };