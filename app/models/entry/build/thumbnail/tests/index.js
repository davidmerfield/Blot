describe("thumbnail", function() {
  // Set up tests
  beforeEach(global.createUser);
  beforeEach(global.createBlog);
  beforeEach(require('./util/emptyTestDataDir'));

  // Tear down
  afterEach(global.removeUser);
  afterEach(global.removeBlog);
  afterEach(require('./util/emptyTestDataDir'));
    
  var localPath = require('helper').localPath;
  var fs = require('fs-extra');

  require('./candidates');
  require('./create');

  it("creates thumbnails", function(done) {
    
    var thumbnail = require("../index");
    var metadata = {};
    var imagePath = '/portrait.jpg';
    var html = '<img src="' + imagePath + '">';
    var path = '/post.txt';

    fs.copyFileSync(__dirname + '/images/' + imagePath, localPath(global.blog.id, imagePath));

    thumbnail(global.blog, path, metadata, html, function(err, result){

      expect(err).toBe(null);
      expect(result).toEqual(jasmine.any(Object));
      expect(result.small).toEqual(jasmine.any(Object));
  
      done();
    });
  });

  it("does not create thumbnails if there are none", function(done) {
    
    var thumbnail = require("../index");
    var metadata = {};
    var html = '<p>Hello, world!</p>';
    var path = '/post.txt';

    thumbnail(global.blog, path, metadata, html, function(err, result){

      expect(err).toBe(null);
      expect(result).toBe(null);
  
      done();
    });
  });  
});
