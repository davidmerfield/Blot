var User = require('user');

module.exports = function (req, callback) {

  // Todo store the db name & email so we don't have to
  // fetch this for every page load...
  User.makeClient(req.user.uid, function(err, client){

    if (err) return callback(err);

    client.getAccountInfo(function(err, info){

      if (err) return callback(err);

      callback(null, info, client);
    });
  });
};