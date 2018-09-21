var createRepo = require('./createRepo');
var clone = require('./clone');
var Git = require("simple-git");
var localPath = require('helper').localPath;
module.exports = function (done) {
  createRepo(function(err){

    if (err) return done(err);
      
    clone(function(err, clonedDir){

      if (err) return done(err);

      try {
        global.bareGitClient = Git(__dirname + '/../../data/' + global.blog.handle + '.git').silent(true);
        global.liveGitClient = Git(localPath(global.blog.id, '/')).silent(true);
        global.usersGitClient = Git(clonedDir).silent(true);
      } catch (err) {
        return done(err);
      }

      global.usersGitDirectory = clonedDir;
      done(null);
    });
  });
};