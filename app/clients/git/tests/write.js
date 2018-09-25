describe("write", function() {
  beforeEach(require("./util/createRepo"));
  var originalTimeout;

  beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  var write = require("../write");
  var clone = require("./util/clone");
  var Git = require("simple-git");
  var fs = require("fs-extra");
  var localPath = require('helper').localPath;

  it("should return an error if there is no git repo in blog folder", function(done){

    fs.removeSync(localPath(global.blog.id, '.git'));

    write(global.blog.id, '/path', '', function(err){

      expect(err.message).toContain('repo does not exist');

      done();
    });
  });


  it("writes a file", function(done) {
    var git;
    var path = "/How/about That name.txt";
    var content = "Hello, world!";

    clone(function(err, clonedDir) {
      expect(err).toEqual(null);

      write(global.blog.id, path, content, function() {

        expect(err).toEqual(null);

        git = Git(clonedDir).silent(true);

        git.pull(function(err) {
          expect(err).toEqual(null);
          expect(fs.readFileSync(clonedDir + path, "utf-8")).toEqual(content);

          done();
        });
      });
    });
  });
});
