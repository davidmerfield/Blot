describe("image", function() {
  
  global.test.blog();

  var image = require("./index");
  var cheerio = require("cheerio");
  var fs = require("fs-extra");
  var localPath = require("helper").localPath;
  var config = require('config');
  var join = require('path').join;

  it("returns a different cached image when source image is modified", function(done) {
    var image = "/tests-image.png";
    var modifiedImage = "/tests-image-modified.png";
    var html = '<img src="' + image + '">';
    var blog = this.blog;

    fs.copySync(__dirname + image, localPath(blog.id, image));

    render(blog, html, function(err, firstResult) {
      expect(err).toBe(null);

      fs.copySync(__dirname + modifiedImage, localPath(blog.id, image));

      render(blog, html, function(err, secondResult) {
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
    var blog = this.blog;
    fs.copySync(__dirname + path, localPath(this.blog.id, path));
      
    render(blog, html, function(err, firstResult) {
      
      render(blog, html, function(err, secondResult) {

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
    var blog = this.blog;

    fs.copySync(__dirname + path, localPath(blog.id, path));

    render(blog, html, function(err, result) {
      expect(result).toContain(".png");
      expect(result).toContain("/_image_cache/");

      var cachedImagePath = result.slice(result.indexOf('/_image_cache/'));
      cachedImagePath = cachedImagePath.slice(0, cachedImagePath.indexOf('"'));

      // Does the cached image exist on disk?
      fs.stat(join(config.blog_static_files_dir, blog.id, cachedImagePath), function(err, stat){

        expect(err).toEqual(null);
        expect(stat.isFile()).toEqual(true);
        done();        
      });
    });
  });

  // Wrapper around dumb API for this plugin
  function render(blog, html, callback) {
    var options = { blogID: blog.id };
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
