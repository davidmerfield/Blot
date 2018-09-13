describe("markdown converter", function() {

  var fs = require('fs-extra');
  var markdown = require('../index');

  beforeEach(global.createUser);
  beforeEach(global.createBlog);

  afterEach(global.removeBlog);
  afterEach(global.removeUser);

  it("converts basic markdown", function(done){

    var path = '/basic-post.txt';
    var blogDir = process.env.BLOT_DIRECTORY + '/blogs/' + global.blog.id;
    var options = {};

    fs.copyFileSync(__dirname + path, blogDir + path);

    markdown.read(global.blog, path, options, function(err, html, stat){

      expect(err).toBe(null);
      expect(stat).toEqual(jasmine.any(Object));
      expect(html).toEqual(fs.readFileSync(__dirname + '/basic-post.html', 'utf-8'));

      console.log(html, stat);

      done();
    });
  });
});