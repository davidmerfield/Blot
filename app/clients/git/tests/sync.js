xdescribe("sync", function() {
  // Sets up a clean test blog (this.blog) for each test,
  // sets the blog's client to git (this.client), then creates
  // a test server with the git client's routes exposed, then
  // cleans everything up when each test has finished.
  require("./setup")();

  var waitForSyncToFinish = function main (done) {

  Sync(this.blog.id, function(_cb){
    _cb(null);
  }, function(err, unavailable){

    if (err) return done(err);

    if (unavailable) {
      setTimeout(function(){

        main(done);

      }, 1000);

    } else {
      done(null);
    }
  });
};

  var pushAllChanges = function(gitClient, callback) {
  gitClient.add(".", function(err) {
    if (err) return callback(new Error(err));

    gitClient.commit("initial", function(err) {
      if (err) return callback(new Error(err));

      gitClient.push(function(err) {
        if (err) return callback(new Error(err));

        callback(null);
      });
    });
  });
};

var Entry = require("entry");
var Entries = require("entries");
var Sync = require("sync");
var localPath = require("helper").localPath;
var fs = require("fs-extra");

  var checkPostExists = function(expectedEntry, callback) {

  var context = this;

  if (!expectedEntry.path) throw new Error('Pass a path as a property of the entry as first argument');

  Entry.get(context.blog.id, expectedEntry.path, function(entry) {

    if (!entry) return debug(context, expectedEntry.path, callback);

    for (var i in expectedEntry)
      expect(expectedEntry[i]).toEqual(entry[i]);

    return callback(null);
  });
};


function debug (context, path, callback) {
      var message = "No entry exists " + path;

    context.usersGitClient.log(function(err, log) {
      message += "\nUser client last commit: " + log.latest.hash;

      context.bareGitClient.log(function(err, log) {
        message += "\nBare client last commit: " + log.latest.hash;

        context.liveGitClient.log(function(err, log) {
          message += "\nLive client last commit: " + log.latest.hash;

          message += "\nFiles: " + fs.readdirSync(localPath(this.blog.id, "/"));

          Entries.getAllIDs(context.blog.id, function(err, entries) {
            message += "\nEntries: " + entries;

            return callback(new Error(message));
          });
        });
      });
    });
}
  
  // beforeEach(require("./util/setupUser"));

  var sync = require("../sync");

  // if two files are pushed, and one produces an error when calling
  // set() the other should sync just fine.
  // xit("should sync good changes even if one produces a sync error", function(done) {done()});

  // pretty basic
  it("should sync an updated file", function(done) {
    var path = "/Hello world.txt";
    var content = "Hello, World!";
    var contentChanged = "New, World!";
    var initialPost = { path: path, title: content };
    var changedPost = { path: path, title: contentChanged };
    var pathInBlogFolder = localPath(this.blog.id, path);

    fs.outputFileSync(this.usersGitDirectory + path, content);

    pushAllChanges(this.usersGitClient, function(err) {
      if (err) return done.fail(err);
      waitForSyncToFinish(function(err) {
        if (err) return done.fail(err);
        checkPostExists(initialPost, function(err) {
          if (err) return done.fail(err);
          fs.outputFileSync(this.usersGitDirectory + path, contentChanged);

          pushAllChanges(this.usersGitClient, function(err) {
            if (err) return done.fail(err);
            waitForSyncToFinish(function(err) {
              if (err) return done.fail(err);
              checkPostExists(changedPost, function(err) {
                if (err) return done.fail(err);                expect(fs.readFileSync(pathInBlogFolder, "utf-8")).toEqual(
                  contentChanged
                );
                done();
              });
            });
          });
        });
      });
    });
  }, 100);

  // commit -> commit -> push etc...
  it("should process multiple unsynced commits properly", function(done) {
    var firstPath = "/Hello world.txt";
    var firstContent = "Hello, World!";

    var secondPath = "/New world.txt";
    var secondContent = "New, World!";

    var usersGitDirectory = this.usersGitDirectory;
    var usersGitClient = this.usersGitClient;

    fs.outputFileSync(usersGitDirectory + firstPath, firstContent);

    usersGitClient.add(".", function(err) {
      if (err) return done.fail(err);
      usersGitClient.commit("Added first path", function(err) {
        if (err) return done.fail(err);
        fs.outputFileSync(usersGitDirectory + secondPath, secondContent);

        pushAllChanges(usersGitClient, function(err) {
          if (err) return done.fail(err);
          waitForSyncToFinish(function(err) {
            if (err) return done.fail(err);
            checkPostExists({ path: firstPath }, function(err) {
              if (err) return done.fail(err);
              checkPostExists({ path: secondPath }, function(err) {
                if (err) return done.fail(err);                done();
              });
            });
          });
        });
      });
    });
  });

  // Allow pulls to go through under buggy conditions
  it("should reset any uncommitted changes to blog folder", function(done) {
    var path = "/Hello world.txt";
    var content = "Hello, World!";
    var contentBadChange = "Bad, World!";
    var contentGoodChange = "Good, World!";

    var usersGitDirectory = this.usersGitDirectory;
    var usersGitClient = this.usersGitClient;
    var blog = this.blog;

    fs.outputFileSync(usersGitDirectory + path, content);

    pushAllChanges(usersGitClient, function(err) {
      if (err) return done.fail(err);
      waitForSyncToFinish(function(err) {
        if (err) return done.fail(err);
        checkPostExists({ path: path }, function(err) {
          if (err) return done.fail(err);
          fs.outputFileSync(localPath(blog.id, path), contentBadChange);
          fs.outputFileSync(usersGitDirectory + path, contentGoodChange);

          pushAllChanges(usersGitClient, function(err) {
            if (err) return done.fail(err);
            waitForSyncToFinish(function(err) {
              if (err) return done.fail(err);              expect(
                fs.readFileSync(localPath(blog.id, path), "utf-8")
              ).toEqual(contentGoodChange);
              done();
            });
          });
        });
      });
    });
  });

  it("should return an error if there is no git repo in blog folder", function(done) {
    fs.removeSync(localPath(this.blog.id, ".git"));

    sync(this.blog, function(err) {
      expect(err.message).toContain("repo does not exist");

      done();
    });
  });

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

  // Git sometimes truncates path and I was running into this issue
  it(
    "handles deeply nested files",
    function(done) {
      var blogDir = localPath(this.blog.id, "/");
      var path =
        "/Git/truncates/paths/to/files/in/its/summaries/depending/on/the/width/of/the/shell.txt";
      var content = "Hello, World!";

      fs.outputFileSync(this.usersGitDirectory + path, content);
      
      var usersGitDirectory = this.usersGitDirectory;

      pushAllChanges(this.usersGitClient, function(err) {


        if (err) return done.fail(err);
        waitForSyncToFinish(function(err) {
          if (err) return done.fail(err);
          checkPostExists({ path: path }, function(err) {
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
    10 * 1000
  ); // 10s for this test... not sure why it needs longer but hey

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
  
  it("accepts a push", function(done) {
    var blogDir = localPath(this.blog.id, "/");
    var path = "/Hello world.txt";
    var content = "Hello, World!";
    var usersGitDirectory = this.usersGitDirectory;
    
    fs.outputFileSync(this.usersGitDirectory + path, content);

    pushAllChanges(this.usersGitClient, function(err) {
      if (err) return done.fail(err);
      waitForSyncToFinish(function(err) {
        if (err) return done.fail(err);
        checkPostExists({ path: path }, function(err) {
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
