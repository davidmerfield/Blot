var createRepo = require('./createRepo');
var clone = require('./clone');
var Git = require("simple-git");
var localPath = require('helper').localPath;
var dataDir = require('../../dataDir');

module.exports = function (done) {

  var context = this;
  var blog = this.blog;

  createRepo(blog, function(err, token){

    if (err) return done(err);
      
    clone(blog, function(err, clonedDir){

      if (err) return done(err);

      try {
        context.bareGitClient = Git(dataDir + '/' + blog.handle + '.git').silent(true);
        context.liveGitClient = Git(localPath(blog.id, '/')).silent(true);
        context.usersGitClient = Git(clonedDir).silent(true);
      } catch (err) {
        return done(err);
      }

      context.token = token;
      context.usersGitDirectory = clonedDir;
      done(null);
    });
  });
};