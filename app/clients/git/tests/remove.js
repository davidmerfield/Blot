describe("git client remove", function() {
  // Sets up a clean test blog (this.blog) for each test,
  // sets the blog's client to git (this.client), then creates
  // a test server with the git client's routes exposed, then
  // cleans everything up when each test has finished.
  require("./setup")();

  var remove = require("../remove");
  var write = require("../write");
  var Git = require("simple-git");
  var fs = require("fs-extra");
  var localPath = require("helper").localPath;

  it("should return an error if there is no git repo in blog folder", function(done) {
    fs.removeSync(localPath(this.blog.id, ".git"));

    remove(this.blog.id, "/path", function(err) {
      expect(err.message).toContain("does not exist");

      done();
    });
  });

  it("does not error when removing a file that does not exist", function(done) {

    remove(this.blog.id, "/path", function(err) {

      if (err) return done.fail(err);

      done();
    });
  });


  it("removes a file", function(done) {
    var repoDirectory = this.repoDirectory;
    var git = Git(repoDirectory).silent(true);
    var path = "/How/about That name.txt";
    var content = "Hello, world!";
    var blogID = this.blog.id;

    write(blogID, path, content, function(err) {
      
      if (err) return done.fail(err);

      git.pull(function(err) {
        if (err) return done.fail(err);

        expect(fs.readFileSync(repoDirectory + path, "utf-8")).toEqual(content);

        remove(blogID, path, function(err) {
          if (err) return done.fail(err);

          git.pull(function(err) {
            if (err) return done.fail(err);

            expect(fs.readdirSync(repoDirectory)).toEqual([".git"]);
            done();
          });
        });
      });
    });
  });
});
