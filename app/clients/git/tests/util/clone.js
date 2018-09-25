module.exports = function (blog, done) {

  var testDataDirectory = require("./testDataDirectory");
  var Git = require("simple-git")(testDataDirectory(blog.id)).silent(true);
  var repoUrl = require("./repoUrl");
  var database = require('../../database');

  database.getToken(blog.id, function(err, token) {

    if (err) return done(err);  

    var url = repoUrl(blog.handle, token, blog.handle);

    Git.clone(url, function(err) {
      
      if (err) return done(new Error(err));

      done(null, testDataDirectory(blog.id) + '/' + blog.handle);
    });
  });
};
