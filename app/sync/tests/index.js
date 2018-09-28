describe("sync", function() {
  var sync = require("../index");

  // Set up a test blog before each test
  global.test.blog();

  it("acquires a lease for a blog", function(done) {
    sync(
      this.blog.id,
      function(change, done) {
        expect(change).toEqual(jasmine.any(Object));
        expect(change.set).toEqual(jasmine.any(Function));
        expect(change.drop).toEqual(jasmine.any(Function));
        expect(change.mkdir).toEqual(jasmine.any(Function));
        expect(done).toEqual(jasmine.any(Function));

        done();
      },
      function(err, failedToAcquireLock) {
        if (err) return done.fail(err);

        expect(failedToAcquireLock).not.toEqual(true);

        done();
      }
    );
  });

  it("will only allow one sync at once", function(done) {
    var blog = this.blog;
    // we have this flag because main function is invoked again if 
    // we recieve another request for a sync. The flag prevents
    // an infinite loop in the test... not ideal.
    var invoked = false;
    sync(
      blog.id,
      function(change, completed) {
        if (invoked) return completed();

        invoked = true;
        sync(
          blog.id,
          function() {
            done.fail(new Error("Allowed multiple concurrent syncs"));
          },
          function(err, failedToAcquireLock) {
            if (err) return done.fail(err);

            expect(failedToAcquireLock).toEqual(true);
            completed();
          }
        );
      },
      function(err, failedToAcquireLock) {
        if (err) return done.fail(err);

        expect(failedToAcquireLock).not.toEqual(true);

        done();
      }
    );
  });

  
});
