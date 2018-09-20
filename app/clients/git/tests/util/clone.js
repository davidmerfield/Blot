module.exports = function (done) {

  var Git = require("simple-git")(require("./dataDirectory")).silent(true);
  var repoUrl = require("./repoUrl");
  var database = require('../../database');

  database.get_token(global.blog.id, function(err, token) {

    if (err) return done(err);  

    var url = repoUrl(global.blog.handle, token, global.blog.handle);

    Git.clone(url, function(err) {
      
      if (err) return done(new Error(err));

      done(null, require("./dataDirectory") + '/' + global.blog.handle);
    });
  });
};
