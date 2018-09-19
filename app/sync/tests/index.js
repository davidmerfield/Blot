describe("syncer", function() {

  var sync = require('../index');
  var fs = require('fs-extra');
  var localPath = require('helper').localPath;

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

  it("will make a directory", makeDirectory);

  function makeDirectory (done){

    sync(global.blog.id, function(err, folder, release){

      expect(err).toBe(null);

      folder.mkdir('/foo', function(err){

        expect(err).toBe(null);

        expect(fs.readdirSync(localPath(global.blog.id, '/foo'))).toEqual([]);
        expect(fs.readdirSync(localPath(global.blog.id, '/'))).toEqual(['foo']);

        release(done);
      });
    });
  }

  it("updates a directory", function(done){
    
    makeDirectory(function(err){

      expect(err).toBe(null);

      sync(global.blog.id, function(err, folder, release){

        folder.update('/foo', function(err){

          expect(err).toBe(null);

          expect(fs.readdirSync(localPath(global.blog.id, '/foo'))).toEqual([]);
          expect(fs.readdirSync(localPath(global.blog.id, '/'))).toEqual(['foo']);

          release(done);
        });
      });
    });
  });

  it("remove a directory", function(done){
    
    makeDirectory(function(err){

      expect(err).toBe(null);

      sync(global.blog.id, function(err, folder, release){

        folder.remove('/foo', function(err){

          expect(err).toBe(null);

          expect(fs.statSync.bind(this, localPath(global.blog.id, '/foo'))).toThrow();
          expect(fs.readdirSync(localPath(global.blog.id, '/'))).toEqual([]);

          release(done);
        });
      });
    });
  });

  function addFile (done){
      
    var content = 'Hello, World!';
    var path = '/post.txt';

    sync(global.blog.id, function(err, folder, release){

      fs.writeFileSync(__dirname + path, content, 'utf-8');

      folder.add(__dirname + path, path, function(err){

        expect(err).toBe(null);

        require('entry').get(global.blog.id, path, function(entry){
        
          expect(entry.title).toEqual(content);
          expect(entry.id).toEqual(path);

          release(done);
        });
      });
    });
  }

  it("adds a file", addFile);

  it("updates a file", function(done){
  
    var newContent = 'Goodbye, World!';

    addFile(function(err){

      expect(err).toBe(null);

      sync(global.blog.id, function(err, folder, release){

        fs.writeFileSync(localPath(global.blog.id, '/post.txt'), newContent, 'utf-8');

        folder.update('/post.txt', function(err){

          expect(err).toBe(null);

          require('entry').get(global.blog.id, '/post.txt', function(entry){
        
            expect(entry.title).toEqual(newContent);
            release(done);
          });
        });
      });
    });
  });

  it("removes a file through update", function(done){
    
    addFile(function(err){

      expect(err).toBe(null);

      sync(global.blog.id, function(err, folder, release){

        fs.removeSync(localPath(global.blog.id, '/post.txt'));

        folder.update('/post.txt', function(err){

          expect(err).toBe(null);
          expect(fs.statSync.bind(this, localPath(global.blog.id, '/post.txt'))).toThrow();

          require('entry').get(global.blog.id, '/post.txt', function(entry){
        
            expect(entry.deleted).toEqual(true);
            release(done);
          });
        });
      });
    });
  });

  it("removes a file", function(done){
    
    addFile(function(err){

      expect(err).toBe(null);

      sync(global.blog.id, function(err, folder, release){

        fs.writeFileSync(__dirname + '/post.txt', 'Hello, World!', 'utf-8');

        folder.remove('/post.txt', function(err){

          expect(err).toBe(null);
          expect(fs.statSync.bind(this, localPath(global.blog.id, '/post.txt'))).toThrow();

          require('entry').get(global.blog.id, '/post.txt', function(entry){
        
            expect(entry.deleted).toEqual(true);
            release(done);
          });
        });
      });
    });
  });
});