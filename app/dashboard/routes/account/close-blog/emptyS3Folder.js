var removeFolder = require('../../../../upload/removeFolder');

module.exports = function (req, res, next) {

  if (!req.blogToClose || !req.blogToClose.id) return next();

  removeFolder(req.blogToClose.id, function(err){

    if (err) console.log(err);

    next();
  });
};