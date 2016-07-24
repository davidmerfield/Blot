var User = require('../../models/user');

module.exports = function (req, callback) {

  User.getBy({uid: req.blog.owner}, function(err, user){

    return callback(err, user.name);
  });
};