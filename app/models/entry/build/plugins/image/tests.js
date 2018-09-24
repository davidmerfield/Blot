describe("image", function() {
  beforeEach(global.createUser);
  beforeEach(global.createBlog);

  afterEach(global.removeBlog);
  afterEach(global.removeUser);

  var image = require("./index");
  var cheerio = require("cheerio");
  var fs = require("fs-extra");
  var localPath = require("helper").localPath;

  it("returns a different cached image when source image is modified", function(done) {
    var image = "/tests-image.png";
    var modifiedImage = "/tests-image-modified.png";
    var html = '<img src="' + image + '">';

    fs.copySync(__dirname + image, localPath(global.blog.id, image));

    render(html, function(err, firstResult) {
      expect(err).toBe(null);

      fs.copySync(__dirname + modifiedImage, localPath(global.blog.id, image));

      render(html, function(err, secondResult) {
        expect(err).toBe(null);

        expect(firstResult).toContain("/_image_cache/");
        expect(secondResult).toContain("/_image_cache/");
        expect(firstResult).not.toEqual(secondResult);
        done();
      });
    });
  });

  it("returns the same cached image when re-run", function(done) {
    var path = "/tests-image.png";
    var html = '<img src="' + path + '">';

    fs.copySync(__dirname + path, localPath(global.blog.id, path));
      
    render(html, function(err, firstResult) {
      
      render(html, function(err, secondResult) {

        expect(firstResult).toContain("/_image_cache/");
        expect(secondResult).toContain("/_image_cache/");
        expect(firstResult).toEqual(secondResult);
        done();
      });
    });
  });

  it("caches an image", function(done) {
    var path = "/tests-image.png";
    var html = '<img src="' + path + '">';

    fs.copySync(__dirname + path, localPath(global.blog.id, path));

    render(html, function(err, result) {
      expect(result).toContain(".png");
      expect(result).toContain("/_image_cache/");
      done();
    });
  });

  // Wrapper around dumb API for this plugin
  function render(html, callback) {
    var options = { blogID: global.blog.id };
    var $ = cheerio.load(html);

    image.render(
      $,
      function() {
        callback(null, $.html());
      },
      options
    );
  }
});
