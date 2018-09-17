describe("blog", function() {

  var Blog = require('../../app/models/blog');
  var Entry = require('../../app/models/entry');
  var fs = require('fs-extra');

  beforeEach(require('../helpers/createUser'));
  beforeEach(require('../helpers/createBlog'));

  afterEach(require('../helpers/removeBlog'));
  afterEach(require('../helpers/removeUser'));

  it("an entry", function(done){

    var path = '/post.txt';

    fs.copyFileSync(__dirname + path, process.env.BLOT_DIRECTORY + '/blogs/' + global.blog.id + path);

    Entry.build(global.blog, path, function(err, entry){

      expect(err).toBe(null);
      expect(entry).toEqual(jasmine.any(Object));

      Entry.set(global.blog, path, entry, function(err){

        expect(err).toBe(null);

        Entry.get(global.blog.id, path, function(entry){

          expect(err).toBe(null);
          expect(entry).toEqual(jasmine.any(Object));

          Entry.drop(global.blog.id, path, function(err){

            expect(err).toBe(null);
            done();
          });
        });
      });
    });
  });
});