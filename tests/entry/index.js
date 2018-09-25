describe("blog", function() {

  var Entry = require('../../app/models/entry');
  var fs = require('fs-extra');
  var helper = require('../../app/helper');

  beforeEach(require('../helpers/createUser'));
  beforeEach(require('../helpers/createBlog'));

  afterEach(require('../helpers/removeBlog'));
  afterEach(require('../helpers/removeUser'));

  it("an entry", function(done){

    var path = '/post.txt';

    fs.copyFileSync(__dirname + path, helper.localPath(this.blog.id, path));

    Entry.build(this.blog, path, function(err, entry){

      expect(err).toBe(null);
      expect(entry).toEqual(jasmine.any(Object));

      Entry.set(this.blog.id, path, entry, function(err){

        expect(err).toBe(null);

        Entry.get(this.blog.id, path, function(entry){

          expect(err).toBe(null);
          expect(entry).toEqual(jasmine.any(Object));

          Entry.drop(this.blog.id, path, function(err){

            expect(err).toBe(null);
            done();
          });
        });
      });
    });
  });
});