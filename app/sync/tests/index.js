describe("sync", function() {
  var sync = require("../index");

  // Set up a test blog before each test
  global.test.blog();

  it("acquires a lease for a blog", function(done) {
    sync(this.blog.id, function(err, blogDirectory, update, release) {
      if (err) return done.fail(err);

      expect(blogDirectory).toEqual(jasmine.any(String));
      expect(update).toEqual(jasmine.any(Function));
      expect(release).toEqual(jasmine.any(Function));

      release(function(err, retry) {
        if (err) return done.fail(err);

        expect(retry).toEqual(false);
        done();
      });
    });
  });

  it("will only allow one sync at once", function(done) {
    var blog = this.blog;

    sync(blog.id, function(err, blogDirectory, update, release) {
      if (err) return done.fail(err);

      sync(blog.id, function(err) {
        expect(err.message).toContain("lock the resource");

        release(function(err, retry) {
          if (err) return done.fail(err);

          expect(retry).toEqual(true);
          done();
        });
      });
    });
  });

  it("will release locks when the process dies", function(done) {
    var child = require("child_process").fork(__dirname + "/kill");
    var blog = this.blog;

    child.send(blog.id);

    // Find out if the child managed to acquire a lock on this blog
    child.on("message", function(message) {
      if (message.error) {
        done.fail(message.error);
      } else {
        child.kill();
      }
    });

    // Did sync release the child's lock on the blog when the child
    // died (was killed)? We test this by trying to acquire a lock.
    child.on("close", function() {
      sync(blog.id, function(err, blogDirectory, update, release) {
        if (err) return done.fail(err);
        release(done);
      });
    });
  });

  it("will allow you to sync, release and re-sync", function(done) {
    var blog = this.blog;

    sync(blog.id, function(err, blogDirectory, update, release) {
      if (err) return done.fail(err);

      release(function(err, retry) {
        if (err) return done.fail(err);
        expect(retry).toEqual(false);

        sync(blog.id, function(err, blogDirectory, update, release) {
          if (err) return done.fail(err);

          release(function(err, retry) {
            if (err) return done.fail(err);
            expect(retry).toEqual(false);
            done();
          });
        });
      });
    });
  });
});
