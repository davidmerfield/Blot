var database = require('../../database');

module.exports = function (req, res, next){

  if (!req.query || !req.query.blog) return res.redirect('/clients');

  // Ensure user owns this blog
  if (req.user.blogs.indexOf(req.query.blog) === -1) return res.redirect('/clients');

  database.get(req.query.blog, function(err, account){

    // Overwrite new values
    account.folder = '';
    account.folder_id = '';
    account.cursor = '';
    account.last_sync = Date.now();

    req.new_account = account;

    next();
  });
};