describe("create", function() {

  var create = require('../create');
  var disconnect = require('../disconnect');
  var localPath = require('helper').localPath;
  var clone = require('./util/clone');
  
  // this prevents an existing bare repo from being clobbered
  it("should fail when called twice", function(done) {

    var blog = this.blog;

    create(blog, function(err){
      
      if (err) return done.fail(err);

      create(blog, function(err){
        
        expect(err).not.toEqual(null);
        expect(err).toEqual(jasmine.any(Error));

        done();
      });
    });
  });

  // this prevents an existing bare repo from being clobbered
  // this simulates a user connecting the git client, disconnecting
  // then connecting again..
  it("should not fail when disconnect is called inbetween", function(done) {

    var blog = this.blog;

    create(blog, function(err){
      
      if (err) return done.fail(err);      expect(err).not.toEqual(jasmine.any(Error));

      disconnect(blog.id, function(err){

        if (err) return done.fail(err);        expect(err).not.toEqual(jasmine.any(Error));

        create(blog, function(err){
          
          if (err) return done.fail(err);          expect(err).not.toEqual(jasmine.any(Error));

          done();
        });
      });      
    });
  });  
  
  it("should fail when there is a repo with an origin in the blog's folder", function(done) {

    var Git = require("simple-git");
    var blog = this.blog;

    Git = Git(localPath(blog.id,'/')).silent(true);
    
    Git.init(function(err){

      if (err) return done.fail(err);
      Git.addRemote('origin', 'http://git.com/foo.git', function(err){

        if (err) return done.fail(err);
        create(blog, function(err){
          
          expect(err).not.toEqual(null);
          expect(err).toEqual(jasmine.any(Error));

          done();
        });
      });
    });
  });
  
  it("preserves existing files and folders", function(done) {

    var blogDir = localPath(this.blog.id,'/');
    var fs = require('fs-extra');
    var blog = this.blog;

    fs.outputFileSync(blogDir + '/first.txt', 'Hello');
    fs.outputFileSync(blogDir + '/Sub Folder/second.txt', 'World');
    fs.outputFileSync(blogDir + '/third', '!');

    create(blog, function(err){
      
      if (err) return done.fail(err);
      // Verify files and folders are preserved on Blot's copy of blog folder
      expect(fs.readdirSync(blogDir)).toEqual(['.git', 'Sub Folder', 'first.txt', 'third']);
      expect(fs.readdirSync(blogDir + '/Sub Folder')).toEqual(['second.txt']);

      clone(blog, function(err, clonedDir){

        if (err) return done.fail(err);
        // Verify files and folders are preserved in cloneable folder
        expect(fs.readdirSync(clonedDir)).toEqual(['.git', 'Sub Folder', 'first.txt', 'third']);
        expect(fs.readdirSync(clonedDir + '/Sub Folder')).toEqual(['second.txt']);

        done();
      });
    });
  });

});
