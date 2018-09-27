describe("sync", function() {
  // Sets up a clean test blog (this.blog) for each test,
  // sets the blog's client to git (this.client), then creates
  // a test server with the git client's routes exposed, then
  // cleans everything up when each test has finished.
  require("./setup")();

  var LONG_TIMEOUT = 20 * 1000; // 20s

  var CheckEntry = global.test.CheckEntry;
  var fs = require("fs-extra");
  var async = require("async");
  var sync = require("../sync");
  var basename = require("path").basename;
  var dirname = require("path").dirname;

  // I should also write a function to check that the repoDirectory
  // which simulate's the folder on the user's computer exactly matches
  // the state of the blogDirectory on Blot's server

  beforeEach(function() {
    this.checkEntry = new CheckEntry(this.blog.id);

    this.commitAndPush = new CommitAndPush(this.blog.id, this.git);
    this.writeAndCommit = new WriteAndCommit(this.git, this.repoDirectory);
    this.push = new Push(this.blog.id, this.git);
    this.writeAndPush = new WriteAndPush(
      this.blog.id,
      this.git,
      this.repoDirectory
    );
  });

  // Checks if two directories are identical
  afterEach(function(done) {
    global.test.compareDir(
      this.repoDirectory,
      this.blogDirectory,
      {
        excludeFilter: ".git"
      },
      done
    );
  });

  function Push(blogID, git) {
    return function(callback) {
      git.push(function(err) {
        if (err) return callback(new Error(err));

        (function wait(blogID, callback) {
          // This is blot's sync function, NOT
          // the git client's sync function.
          require("sync")(
            blogID,
            function(_cb) {
              _cb(null);
            },
            function(err, unavailable) {
              if (err) return callback(err);

              if (unavailable) {
                setTimeout(function() {
                  wait(blogID, callback);
                }, 1000);
              } else {
                callback(null);
              }
            }
          );
        })(blogID, callback);
      });
    };
  }

  function WriteAndCommit(git, repoDirectory) {
    return function(path, content, callback) {
      var output = repoDirectory + path;

      fs.outputFile(output, content, function(err) {
        if (err) return callback(err);

        git.add(".", function(err) {
          if (err) return callback(new Error(err));

          git.commit(".", function(err) {
            if (err) return callback(new Error(err));

            callback();
          });
        });
      });
    };
  }

  function CommitAndPush(blogID, git) {
    var push = new Push(blogID, git);

    return function(callback) {
      git.add(".", function(err) {
        if (err) return callback(new Error(err));

        git.commit(".", function(err) {
          if (err) return callback(new Error(err));

          push(callback);
        });
      });
    };
  }

  // Write file to user's clone of the blog's git repo, then
  // push changes to the server, wait for sync to finish.
  function WriteAndPush(blogID, git, repoDirectory) {
    var writeAndCommit = new WriteAndCommit(git, repoDirectory);
    var push = new Push(blogID, git);

    return function(path, content, callback) {
      writeAndCommit(path, content, function(err) {
        if (err) return callback(err);

        push(callback);
      });
    };
  }

  it("should return an error if there is no git repo in blog folder", function(done) {
    fs.removeSync(this.blogDirectory + "/.git");

    sync(this.blog, function(err) {
      expect(err.message).toContain("repo does not exist");
      done();
    });
  });

  it("syncs a file", function(done) {
    var path = this.fake.path(".txt");
    var content = this.fake.file();
    var checkEntry = this.checkEntry;

    this.writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      checkEntry({ path: path }, function(err) {
        if (err) return done.fail(err);

        done();
      });
    });
  }, LONG_TIMEOUT);

  it("syncs updates to a file", function(done) {
    var checkEntry = this.checkEntry;
    var writeAndPush = this.writeAndPush;

    var path = this.fake.path(".txt");

    var title = this.fake.lorem.sentence();
    var content = this.fake.file({ title: title });

    var changedTitle = this.fake.lorem.sentence();
    var changedContent = this.fake.file({ title: changedTitle });

    writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      checkEntry({ path: path, title: title }, function(err) {
        if (err) return done.fail(err);

        writeAndPush(path, changedContent, function(err) {
          if (err) return done.fail(err);

          checkEntry({ path: path, title: changedTitle }, function(err) {
            if (err) return done.fail(err);
            done();
          });
        });
      });
    });
  }, LONG_TIMEOUT);

  it("syncs a renamed file", function(done) {
    var writeAndPush = this.writeAndPush;
    var commitAndPush = this.commitAndPush;

    var path = this.fake.path();
    var newPath = dirname(path) + "/new-" + basename(path);
    var content = this.fake.file();

    var repoDirectory = this.repoDirectory;

    writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      fs.moveSync(repoDirectory + path, repoDirectory + newPath);

      commitAndPush(function(err) {
        if (err) return done.fail(err);

        done();
      });
    });
  }, LONG_TIMEOUT);

  it("syncs a removed file", function(done) {
    var writeAndPush = this.writeAndPush;
    var commitAndPush = this.commitAndPush;
    var repoDirectory = this.repoDirectory;

    // compareDirectory has trouble with nested paths
    // since git does not keep track of empty directories
    var path = '/' + this.fake.lorem.word() + '.txt';

    writeAndPush(path, this.fake.file(), function(err) {
      if (err) return done.fail(err);

      fs.removeSync(repoDirectory + path);

      commitAndPush(function(err) {

        if (err) return done.fail(err);

        done();
      });
    });
  }, LONG_TIMEOUT);

  it("syncs the changes of multiple commits pushed at once", function(done) {
    var writeAndCommit = this.writeAndCommit;
    var checkEntry = this.checkEntry;
    var push = this.push;

    var files = {};

    for (var i = 0; i < 3; i++)
      files[this.fake.path(".txt")] = this.fake.file();

    async.eachOf(
      files,
      function(content, path, next) {
        writeAndCommit(path, content, next);
      },
      function(err) {
        if (err) return done.fail(err);

        push(function(err) {
          if (err) return done.fail(err);

          async.eachOf(
            files,
            function(content, path, next) {
              checkEntry({ path: path }, next);
            },
            done
          );
        });
      }
    );
  }, LONG_TIMEOUT);

  it("handles two pushes during a single sync", function(done) {
    var git = this.git;
    var writeAndPush = this.writeAndPush;
    var fake = this.fake;

    for (var i = 0; i < 15; i++)
      fs.outputFileSync(
        this.repoDirectory + fake.path('.txt'),
        fake.file()
      );

    git.add(".", function(err) {
      if (err) return done(new Error(err));
      git.commit("x", function(err) {
        if (err) return done(new Error(err));
        git.push(function(err) {
          if (err) return done(new Error(err));

          writeAndPush(fake.path(), fake.file(), done);
        });
      });
    });
  }, LONG_TIMEOUT * 2);

  it("resets any uncommitted changes in the server's blog folder", function(done) {
    var writeAndPush = this.writeAndPush;

    var path = "/Hello world.txt";
    var content = "Hello, World!";
    var contentBadChange = "Bad, World!";
    var contentGoodChange = "Good, World!";

    var blogDirectory = this.blogDirectory;

    writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      // This simulates an incorrect change to the blog's source folder
      // made by potentially buggy Blot code. This was NOT done by the client.
      fs.outputFileSync(blogDirectory + path, contentBadChange);

      writeAndPush(path, contentGoodChange, function(err) {
        if (err) return done.fail(err);

        expect(fs.readFileSync(blogDirectory + path, "utf-8")).toEqual(
          contentGoodChange
        );

        done();
      });
    });
  }, LONG_TIMEOUT);
});
