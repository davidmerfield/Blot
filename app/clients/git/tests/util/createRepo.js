module.exports = function (done) {

  var create = require("../../create");
  var database = require("../../database");

  create(global.blog, function(err) {

    if (err) return done(err);

    database.getToken(global.blog.id, function(err, token) {

      if (err) return done(err);  

      global.gitToken = token;
      done();
    });
  });
};