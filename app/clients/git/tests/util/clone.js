module.exports = function (done) {

  var Git = require("simple-git")(require("./testDataDirectory")).silent(true);
  var repoUrl = require("./repoUrl");
  var database = require('../../database');

  database.getToken(global.blog.id, function(err, token) {

    if (err) return done(err);  

    var url = repoUrl(global.blog.handle, token, global.blog.handle);

    Git.clone(url, function(err) {
      
      if (err) return done(new Error(err));

      done(null, require("./testDataDirectory") + '/' + global.blog.handle);
    });
  });
};
