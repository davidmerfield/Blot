describe("blog", function() {

  var Entry = require('../../app/models/entry');
  var fs = require('fs-extra');
  var helper = require('../../app/helper');

  global.test.blog();

  it("an entry", function(done){

    var path = '/post.txt';
    var blog = this.blog;
    
    fs.copyFileSync(__dirname + path, helper.localPath(blog.id, path));

    Entry.build(blog, path, function(err, entry){

      expect(err).toBe(null);
      expect(entry).toEqual(jasmine.any(Object));

      Entry.set(blog.id, path, entry, function(err){

        expect(err).toBe(null);

        Entry.get(blog.id, path, function(entry){

          expect(err).toBe(null);
          expect(entry).toEqual(jasmine.any(Object));

          Entry.drop(blog.id, path, function(err){

            expect(err).toBe(null);
            done();
          });
        });
      });
    });
  });
});