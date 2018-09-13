describe("markdown converter", function() {

  var Blog = require('blog');
  var Entry = require('entry');
  var fs = require('fs-extra');

  beforeEach(global.createUser);
  beforeEach(global.createBlog);

  afterEach(global.removeBlog);
  afterEach(global.removeUser);

  it("an entry", function(done){

    var path = '/post.txt';

    fs.copyFileSync(__dirname + path, process.env.BLOT_DIRECTORY + '/blogs/' + global.blog.id + path);

    Entry.build(global.blog, path, function(err, entry){

      expect(err).toBe(null);
      expect(entry).toEqual(jasmine.any(Object));

      Entry.set(global.blog.id, path, entry, function(err){

        expect(err).toBe(null);

        Entry.get(global.blog.id, path, function(entry){

          expect(err).toBe(null);
          expect(entry).toEqual(jasmine.any(Object));

          console.log(entry);
          
          Entry.drop(global.blog.id, path, function(err){

            expect(err).toBe(null);
            done();
          });
        });
      });
    });
  });
});