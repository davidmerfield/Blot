describe("sync", function() {

  beforeEach(require('./util/setupUser'));

  var localPath = require('helper').localPath;
  var pushAllChanges = require('./util/pushAllChanges');
  var fs = require('fs-extra');

  // Scenario: you push loads of files, Blot takes ages to sync
  // you push one more file: does Blot sync it too?
  it("re-pulls if it recieves a push during sync", function(done) {

    var blogDir = localPath(global.blog.id,'/');
    var usersGitDirectory = global.usersGitDirectory;
    var path = '/Hello world.txt';
    var content = 'Hello, World!';

    for (var i = 0;i< 1000;i++)
      fs.outputFileSync(usersGitDirectory + '/' + i + '.txt', i);

    pushAllChanges(global.usersGitClient, function(err){

      expect(err).toEqual(null);

      fs.outputFileSync(usersGitDirectory + path, content);

      pushAllChanges(global.usersGitClient, function(err){

        expect(err).toEqual(null);

        // We don't know when the git repo in the blog directory
        // will have finished pulling.
        setTimeout(function(){

          // Verify files and folders are preserved in cloneable folder
          expect(fs.readdirSync(blogDir)).toEqual(fs.readdirSync(usersGitDirectory));
          done();

        }, 1000);
      });
    });
  });

  it("accepts a push", function(done) {

    var blogDir = localPath(global.blog.id,'/');
    var path = '/Hello world.txt';
    var content = 'Hello, World!';

    fs.outputFileSync(global.usersGitDirectory + path, content);

    pushAllChanges(global.usersGitClient, function(err){

      expect(err).toEqual(null);

      // We don't know when the git repo in the blog directory
      // will have finished pulling.
      setTimeout(function(){

        // Verify files and folders are preserved in cloneable folder
        expect(fs.readdirSync(blogDir)).toEqual(fs.readdirSync(global.usersGitDirectory));
        done();

      }, 1000);
    });
  });

});
