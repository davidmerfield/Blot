var helper = require('helper');
var localPath = helper.localPath;
var notAllowed = helper.notAllowed;
var rimraf = require('rimraf');

module.exports = function (req, res, next) {

  if (!req.blogToClose.id) return next();

  var blogDir = localPath(req.blogToClose.id, '/*');

  if (notAllowed(blogDir)) return next();

  rimraf(blogDir, function(err){

    if (err) console.log(err);

    next();
  });
};