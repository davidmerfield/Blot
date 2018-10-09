describe("git client sync", function() {
  // Sets up a clean test blog (this.blog) for each test,
  // sets the blog's client to git (this.client), then creates
  // a test server with the git client's routes exposed, then
  // cleans everything up when each test has finished.
  require("./setup")();

  var fs = require("fs-extra");
  var async = require("async");
  var sync = require("../sync");
  var basename = require("path").basename;
  var dirname = require("path").dirname;

  // I should also write a function to check that the repoDirectory
  // which simulate's the folder on the user's computer exactly matches
  // the state of the blogDirectory on Blot's server

  beforeEach(function() {
    this.commitAndPush = new CommitAndPush(
      this.blog.id,
      this.git,
      this.server.port
    );
    this.writeAndCommit = new WriteAndCommit(this.git, this.repoDirectory);
    this.push = new Push(this.blog.id, this.git, this.server.port);
    this.writeAndPush = new WriteAndPush(
      this.blog.id,
      this.git,
      this.repoDirectory,
      this.server.port
    );
  });

  // Checks if two directories are identical
  afterEach(function(done) {
    var ctx = this;

    global.test.compareDir(
      this.repoDirectory,
      this.blogDirectory,
      {
        excludeFilter: ".git"
      },
      function(err) {
        if (!err) return done();

        var message = err.message;

        ctx.gitBare.raw(["rev-parse", "HEAD"], function(err, bareHead) {
          ctx.gitBlot.raw(["rev-parse", "HEAD"], function(err, blotHead) {
            ctx.git.raw(["rev-parse", "HEAD"], function(err, userHead) {
              message +=
                "\n\n" +
                [
                  "State of git repos (HEAD):",
                  "- user's machine: " + (userHead && userHead.trim()),
                  "- bare data repo: " + (bareHead && bareHead.trim()),
                  "- blog directory: " + (blotHead && blotHead.trim())
                ].join("\n");

              done(new Error(message));
            });
          });
        });
      }
    );
  });

  function Push(blogID, git, port) {
    return function(callback) {
      git.push(function(err) {
        if (err) return callback(new Error(err));

        // how do we work out when the sync has finished?
        // in a serious way? without some some settimeout?
        var http = require("http");
        var url = require("url").format({
          protocol: "http",
          hostname: "localhost",
          port: port,
          pathname: "/clients/git/syncs-finished/" + blogID
        });

        http.get(url, function check(res) {
          var response = "";
          res.setEncoding("utf8");
          res.on("data", function(chunk) {
            response += chunk;
          });
          res.on("end", function() {
            if (response === "true") {
              callback(null);
            } else {
              http.get(url, check);
            }
          });
        });
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

  function CommitAndPush(blogID, git, port) {
    var push = new Push(blogID, git, port);

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
  function WriteAndPush(blogID, git, repoDirectory, port) {
    var writeAndCommit = new WriteAndCommit(git, repoDirectory);
    var push = new Push(blogID, git, port);

    return function(path, content, callback) {
      writeAndCommit(path, content, function(err) {
        if (err) return callback(err);

        push(callback);
      });
    };
  }

  it("should return an error if there is no git repo in blog folder", function(done) {
    fs.removeSync(this.blogDirectory + "/.git");

    sync(this.blog.id, function(err) {
      expect(err.message).toContain("repo does not exist");
      done();
    });
  });

  it("handles a new file", function(done) {
    var path = this.fake.path(".txt");
    var content = this.fake.file();

    this.writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      done();
    });
  });

  it("handles updates to a file", function(done) {
    var writeAndPush = this.writeAndPush;
    var path = this.fake.path(".txt");

    var title = this.fake.lorem.sentence();
    var content = this.fake.file({ title: title });

    var changedTitle = this.fake.lorem.sentence();
    var changedContent = this.fake.file({ title: changedTitle });

    writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      writeAndPush(path, changedContent, function(err) {
        if (err) return done.fail(err);

        done();
      });
    });
  });

  it("handles a renamed file", function(done) {
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
  });

  it("handles a removed file", function(done) {
    var writeAndPush = this.writeAndPush;
    var commitAndPush = this.commitAndPush;
    var repoDirectory = this.repoDirectory;

    // compareDirectory has trouble with nested paths
    // since git does not keep track of empty directories
    var path = "/" + this.fake.lorem.word() + ".txt";

    writeAndPush(path, this.fake.file(), function(err) {
      if (err) return done.fail(err);

      fs.removeSync(repoDirectory + path);

      commitAndPush(function(err) {
        if (err) return done.fail(err);

        done();
      });
    });
  });

  it("handles multiple commits pushed at once", function(done) {
    var writeAndCommit = this.writeAndCommit;
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

          done();
        });
      }
    );
  });

  it("handles two pushes during a single sync", function(done) {
    var git = this.git;
    var writeAndPush = this.writeAndPush;
    var fake = this.fake;

    for (var i = 0; i < 10; i++)
      fs.outputFileSync(this.repoDirectory + fake.path(".txt"), fake.file());

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
  });

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

        done();
      });
    });
  });

  it("handles a force push", function(done) {
    var writeAndPush = this.writeAndPush;
    var writeAndCommit = this.writeAndCommit;
    var blogDirectory = this.blogDirectory;
    var repoDirectory = this.repoDirectory;
    var repoUrl = this.repoUrl;
    var git = this.git;

    var path = "/Hello world.txt";
    var content = "Hello, World!";
    var newContent = "Good, World!";
    var badContent = "Bad, World!";

    writeAndPush(path, content, function(err) {
      if (err) return done.fail(err);

      // delete .git repo, then re-init, then add remote,
      // then write and push. It should fail.
      fs.removeSync(repoDirectory + "/.git");
      git.init(repoDirectory, function(err) {
        if (err) return done.fail(new Error(err));

        git.addRemote("origin", repoUrl, function(err) {
          if (err) return done.fail(new Error(err));

          writeAndCommit(path, newContent, function(err) {
            if (err) return done.fail(err);

            git.push("origin", "master", { "--set-upstream": true }, function(
              err
            ) {
              expect(err).toContain(
                "Updates were rejected because the remote contains work"
              );

              // Spanner in the works! I was worried about this line
              // in the git man pages for rebase: "It is possible that a merge failure
              // will prevent this process from being completely automatic."
              // So I want to throw in a bad change to the working tree of
              // the repo in the blog folder on Blot to see if Blot copes.
              fs.outputFileSync(blogDirectory + path, badContent);

              git.push(
                "origin",
                "master",
                { "--set-upstream": true, "--force": true },
                function(err) {
                  if (err) return done.fail(new Error(err));

                  writeAndPush("/other-path.txt", "other file", function(err) {
                    if (err) return done.fail(new Error(err));

                    done();
                  });
                }
              );
            });
          });
        });
      });
    });
  });
});
