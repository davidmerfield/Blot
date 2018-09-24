describe("sync", function() {
  beforeEach(require("./util/setupUser"));

  var waitForSyncToFinish = require("./util/waitForSyncToFinish");
  var localPath = require("helper").localPath;
  var pushAllChanges = require("./util/pushAllChanges");
  var fs = require("fs-extra");
  var checkPostExists = require("./util/checkPostExists");
  var sync = require("../sync");

  // Allow pulls to go through under buggy conditions
  it("should reset any uncommitted changes to blog folder", function(done) {
    var path = "/Hello world.txt";
    var content = "Hello, World!";
    var contentBadChange = "Bad, World!";
    var contentGoodChange = "Good, World!";

    fs.outputFileSync(global.usersGitDirectory + path, content);

    pushAllChanges(global.usersGitClient, function(err) {
      expect(err).toEqual(null);

      waitForSyncToFinish(function(err) {
        expect(err).toEqual(null);

        checkPostExists(path, function(err) {
          expect(err).toEqual(null);

          fs.outputFileSync(localPath(global.blog.id, path), contentBadChange);
          fs.outputFileSync(global.usersGitDirectory + path, contentGoodChange);

          pushAllChanges(global.usersGitClient, function(err) {
            expect(err).toEqual(null);

            waitForSyncToFinish(function(err) {
              expect(err).toEqual(null);
              expect(fs.readFileSync(localPath(global.blog.id, path), 'utf-8')).toEqual(contentGoodChange);
              done();
            });
          });
        });
      });
    });
  });

  it("should return an error if there is no git repo in blog folder", function(done) {
    fs.removeSync(localPath(global.blog.id, ".git"));

    sync(global.blog.handle, function(err) {
      expect(err.message).toContain("repo does not exist");

      done();
    });
  });

  // Scenario: you push loads of files, Blot takes ages to sync
  // you push one more file: does Blot sync it too?
  it(
    "re-pulls if it recieves a push during sync",
    function(done) {
      var blogDir = localPath(global.blog.id, "/");
      var usersGitDirectory = global.usersGitDirectory;
      var path = "/Hello world.txt";
      var content = "Hello, World!";

      for (var i = 0; i < 100; i++)
        fs.outputFileSync(usersGitDirectory + "/" + i + ".txt", i);

      pushAllChanges(global.usersGitClient, function(err) {
        expect(err).toEqual(null);

        fs.outputFileSync(usersGitDirectory + path, content);

        pushAllChanges(global.usersGitClient, function(err) {
          expect(err).toEqual(null);

          waitForSyncToFinish(function(err) {
            expect(err).toEqual(null);

            // Verify files and folders are preserved in cloneable folder
            expect(fs.readdirSync(blogDir)).toEqual(
              fs.readdirSync(usersGitDirectory)
            );
            done();
          });
        });
      });
    },
    30000
  );

  // Git sometimes truncates path and I was running into this issue
  it("handles deeply nested files", function(done) {
    var blogDir = localPath(global.blog.id, "/");
    var path =
      "/Hello/you/fhjdskfhksdhfkj/fsdhfsjdkfhjkds/fsdhkjfsdhjk/fdshkfshjdkfjshdf/fdshjfhsdjk/fsdhjfksdjh/world.txt";
    var content = "Hello, World!";

    fs.outputFileSync(global.usersGitDirectory + path, content);

    pushAllChanges(global.usersGitClient, function(err) {
      expect(err).toEqual(null);

      waitForSyncToFinish(function(err) {
        expect(err).toEqual(null);

        checkPostExists(path, function(err) {
          expect(err).toEqual(null);

          // Verify files and folders are preserved in cloneable folder
          expect(fs.readdirSync(blogDir)).toEqual(
            fs.readdirSync(global.usersGitDirectory)
          );
          done();
        });
      });
    });
  });

  // what about a case sensitivity change?
  it("handles renamed files", function(done) {
    var blogDir = localPath(global.blog.id, "/");
    var firstPath =
      "/Hello/you/fhjdskfhksdhfkj/fsdhfsjdkfhjkds/fsdhkjfsdhjk/fdshkfshjdkfjshdf/fdshjfhsdjk/fsdhjfksdjh/Foo bar.txt";
    var secondPath =
      "/Hello/you/fhjdskfhksdhfkj/fsdhfsjdkfhjkds/fsdhkjfsdhjk/fdshkfshjdkfjshdf/fdshjfhsdjk/fsdhjfksdjh/baz Bat.txt";
    var content = "Hello, World!";

    fs.outputFileSync(global.usersGitDirectory + firstPath, content);

    pushAllChanges(global.usersGitClient, function(err) {
      expect(err).toEqual(null);

      waitForSyncToFinish(function(err) {
        expect(err).toEqual(null);

        fs.moveSync(
          global.usersGitDirectory + firstPath,
          global.usersGitDirectory + secondPath
        );

        pushAllChanges(global.usersGitClient, function(err) {
          expect(err).toEqual(null);

          waitForSyncToFinish(function(err) {
            expect(err).toEqual(null);

            checkPostExists(secondPath, function(err) {
              expect(err).toEqual(null);

              // Verify files and folders are preserved in cloneable folder
              expect(fs.readdirSync(blogDir)).toEqual(
                fs.readdirSync(global.usersGitDirectory)
              );

              done();
            });
          });
        });
      });
    });
  });
  it("accepts a push", function(done) {
    var blogDir = localPath(global.blog.id, "/");
    var path = "/Hello world.txt";
    var content = "Hello, World!";

    fs.outputFileSync(global.usersGitDirectory + path, content);

    pushAllChanges(global.usersGitClient, function(err) {
      expect(err).toEqual(null);

      waitForSyncToFinish(function(err) {
        expect(err).toEqual(null);

        checkPostExists(path, function(err) {
          expect(err).toEqual(null);

          // Verify files and folders are preserved in cloneable folder
          expect(fs.readdirSync(blogDir)).toEqual(
            fs.readdirSync(global.usersGitDirectory)
          );
          done();
        });
      });
    });
  });
});
