xdescribe("remove", function() {
  
  beforeEach(require("./util/setupUser"));
  var originalTimeout;

  beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  var write = require("../write");
  var remove = require("../remove");
  var clone = require("./util/clone");
  var Git = require("simple-git");
  var fs = require("fs-extra");
  var localPath = require('helper').localPath;

  it("should return an error if there is no git repo in blog folder", function(done){

    fs.removeSync(localPath(this.blog.id, '.git'));

    remove(this.blog.id, '/path', function(err){

      expect(err.message).toContain('repo does not exist');

      done();
    });
  });

  it("removes a file", function(done) {
    var git;
    var path = "/How/about That name.txt";
    var content = "Hello, world!";

    clone(function(err, clonedDir) {
      if (err) return done.fail(err);
      write(this.blog.id, path, content, function(err) {
        if (err) return done.fail(err);        
        git = Git(clonedDir).silent(true);

        git.pull(function(err) {
          if (err) return done.fail(err);          expect(fs.readFileSync(clonedDir + path, "utf-8")).toEqual(content);

          remove(this.blog.id, path, function(err) {
            if (err) return done.fail(err);
            git.pull(function(err) {
              if (err) return done.fail(err);              expect(fs.readdirSync(clonedDir)).toEqual([".git"]);

              done();
            });
          });
        });
      });
    });
  });
});
