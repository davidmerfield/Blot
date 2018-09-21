var createRepo = require('./createRepo');
var clone = require('./clone');
var Git = require("simple-git");

module.exports = function (done) {
  createRepo(function(err){

    if (err) return done(err);
      
    clone(function(err, clonedDir){

      if (err) return done(err);

      global.usersGitClient = Git(clonedDir).silent(true);
      global.usersGitDirectory = clonedDir;
      done();
    });
  });
};