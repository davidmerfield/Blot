describe("sync", function() {
  // Sets up a clean test blog (this.blog) for each test,
  // sets the blog's client to git (this.client), then creates
  // a test server with the git client's routes exposed, then
  // cleans everything up when each test has finished.
  require("./setup")();

  var Entry = require("entry");
  var Entries = require("entries");
  var Sync = require("sync");
  var localPath = require("helper").localPath;
  var fs = require("fs-extra");

  

  // Scenario: you push loads of files, Blot takes ages to sync
  // you push one more file: does Blot sync it too?
  it(
    "re-pulls if it recieves a push during sync",
    function(done) {

      var blogDir = localPath(this.blog.id, "/");
      var usersGitDirectory = this.usersGitDirectory;
      var usersGitClient = this.usersGitClient;

      var path = "/Hello world.txt";
      var content = "Hello, World!";

      for (var i = 0; i < 100; i++)
        fs.outputFileSync(usersGitDirectory + "/" + i + ".txt", i);

      pushAllChanges(usersGitClient, function(err) {
        if (err) return done.fail(err);
        fs.outputFileSync(usersGitDirectory + path, content);

        pushAllChanges(usersGitClient, function(err) {
          if (err) return done.fail(err);
          waitForSyncToFinish(function(err) {
            if (err) return done.fail(err);
            // Verify files and folders are preserved in cloneable folder
            expect(fs.readdirSync(blogDir)).toEqual(
              fs.readdirSync(usersGitDirectory)
            );
            done();
          });
        });
      });
    },
    30 * 1000 // 30s
  );

  // what about a case sensitivity change?
  xit("handles renamed files", function(done) {
    var blogDir = localPath(this.blog.id, "/");
    var firstPath =
      "/Hello/you/fhjdskfhksdhfkj/fsdhfsjdkfhjkds/fsdhkjfsdhjk/fdshkfshjdkfjshdf/fdshjfhsdjk/fsdhjfksdjh/Foo bar.txt";
    var secondPath =
      "/Hello/you/fhjdskfhksdhfkj/fsdhfsjdkfhjkds/fsdhkjfsdhjk/fdshkfshjdkfjshdf/fdshjfhsdjk/fsdhjfksdjh/baz Bat.txt";
    var content = "Hello, World!";
    var usersGitDirectory = this.usersGitDirectory;
    var usersGitClient = this.usersGitClient;

    fs.outputFileSync(this.usersGitDirectory + firstPath, content);

    pushAllChanges(this.usersGitClient, function(err) {
      if (err) return done.fail(err);
      waitForSyncToFinish(function(err) {
        if (err) return done.fail(err);
        fs.moveSync(
          usersGitDirectory + firstPath,
          usersGitDirectory + secondPath
        );

        pushAllChanges(usersGitClient, function(err) {
          if (err) return done.fail(err);
          waitForSyncToFinish(function(err) {
            if (err) return done.fail(err);
            checkPostExists({ path: secondPath }, function(err) {
              if (err) return done.fail(err);
              // Verify files and folders are preserved in cloneable folder
              expect(fs.readdirSync(blogDir)).toEqual(
                fs.readdirSync(usersGitDirectory)
              );

              done();
            });
          });
        });
      });
    });
  });
  
});
