module.exports = function setup(options) {
  options = options || {};

var dataDir = require('../../dataDir');
var disconnect = require('../../disconnect');
var fs = require('fs-extra');
var Express = require("express");

var setClientToGit = require('./setClientToGit');

var server = {
  start: function(done) {
    var port = 1000 + Math.round(Math.random() * 10000);
    this.server = Express()
      .use("/clients/git", require("../../routes").site)
      .listen(port, done);
    this.server.port = port;
  },
  close: function(done) {
    this.server.close(done);
  }
};


  // Sets up a temporary test blog and cleans it up after
  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  // Set up a clean server for each test
  beforeEach(server.start);
  afterEach(server.close);


  // Clean a bare repo in app/clients/git/data if needed
  afterEach(function(done){
    // Each test creates a new bare repo in app/clients/git/data
    // Be careful cleaning this folder because it might contain
    // production data if the tests are accidentally run in prod.
    // In future it might be nice to pass a custom path to the 
    // git client when initializing it? That way we could just 
    // wipe the contents of this custom path at the end....
    fs.remove(dataDir + '/' + this.blog.handle + '.git', done);
  });

  afterEach(function(done){
    disconnect(this.blog.id, done);
  });

  if (options.setClientToGit !== false)
    beforeEach(function(done) {
      var context = this;

      setClientToGit(this.blog, this.server.port, function(err, repoUrl) {
        if (err) return done(err);

        context.repoUrl = repoUrl;
        done();
      });
    });

  if (options.clone !== false)
    beforeEach(function(done) {
      var context = this;
      require("simple-git")(this.tmp)
        .silent(true)
        .clone(this.repoUrl, function(err) {
          if (err) return done(new Error(err));
          context.repoDirectory = context.tmp + "/" + context.blog.handle;
          done(null);
        });
    });
};
