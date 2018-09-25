module.exports = function (blog, callback) {

  var create = require("../../create");
  var database = require("../../database");

  create(blog, function(err) {

    if (err) return callback(err);

    database.getToken(blog.id, function(err, token) {

      if (err) return callback(err);  

      callback(null, token);
    });
  });
};