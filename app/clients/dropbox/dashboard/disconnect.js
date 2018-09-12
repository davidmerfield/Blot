var client = require('../client');

module.exports = function (req, res, next) {

  client.disconnect(req.blog.id, function(err){

    if (err) return next(err);

    res.redirect('/settings/client');
  });
};