describe("sync", function() {

  var create = require('../create');
  var clone = require('./util/clone');
  var localPath = require('helper').localPath;
  var Git = require("simple-git");

  it("accepts a push", function(done) {

    var blogDir = localPath(global.blog.id,'/');
    var fs = require('fs-extra');
    var git;

    create(global.blog, function(err){
      
      expect(err).toEqual(null);

      // clonedDir is equivilent to the folder containing
      // the repo on the user's computer.
      clone(function(err, clonedDir){

        expect(err).toEqual(null);

        git = Git(clonedDir).silent(true);

        fs.outputFileSync(clonedDir + '/Hello world.txt', 'Hello, World!');

        git.add('.', function(err){

          expect(err).toEqual(null);

          git.commit('initial', function(err){

            expect(err).toEqual(null);

            git.push(function(err){

              expect(err).toEqual(null);

              // We don't know when the git repo in the blog directory
              // will have finished pulling.
              setTimeout(function(){

                // Verify files and folders are preserved in cloneable folder
                expect(fs.readdirSync(blogDir)).toEqual(fs.readdirSync(clonedDir));
                done();

              }, 1000);              
            });
          });
        });
      });
    });
  });

});
