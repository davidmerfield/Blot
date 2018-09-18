describe("syncer", function() {

  var sync = require('../index');

  beforeEach(global.createUser);
  beforeEach(global.createBlog);

  afterEach(global.removeBlog);
  afterEach(global.removeUser);

  it("acquires and releases a lock on a folder", function(done){

    sync(global.blog.id, function(err, update, release){

      expect(err).toBe(null);
      
      release(function(err, retry){

        expect(retry).toBe(false);
        expect(err).toBe(null);

        done();
      });
    });
  });

  it("acquires and releases a sync multiple times", function(done){

    sync(global.blog.id, function(err, update, release){

      expect(err).toBe(null);
      
      release(function(err, retry){

        expect(retry).toBe(false);
        expect(err).toBe(null);

        sync(global.blog.id, function(err, update, release){

          expect(err).toBe(null);

          release(function(err, retry){
    
            expect(retry).toBe(false);
            expect(err).toBe(null);

            done();
          });
        });
      });
    });
  });

  it("will indicate that a retry is needed", function(done){

    sync(global.blog.id, function(err, update, release){

      expect(err).toBe(null);

      sync(global.blog.id, function(err){

        expect(err).not.toBe(null);

        release(function(err, retry){

          expect(retry).toBe(true);
          expect(err).toBe(null);

          done();
        });
      });
    });
  });

});