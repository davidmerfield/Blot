describe("image", function() {
  global.test.blog();

  var image = require("./index");
  var cheerio = require("cheerio");
  var fs = require("fs-extra");
  var localPath = require("helper").localPath;
  var config = require("config");
  var join = require("path").join;
  var crypto = require("crypto");

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

  it("will fetch dimensions of GIFs but will not resize them", function(done) {
    var image = "/tests-image.gif";
    var html = '<img src="' + image + '">';
    var blog = this.blog;

    fs.copySync(__dirname + image, localPath(blog.id, image));

    render(blog, html, function(err, result) {
      if (err) return done.fail(err);

      expect(result).toContain("/_image_cache/");

      // Image cache retrieves dimensions of images that it
      // does not resize or modify
      expect(result).toContain('width="450" height="338"');

      var path =
        config.blog_static_files_dir +
        "/" +
        blog.id +
        result.slice(
          result.indexOf("/_image_cache"),
          result.indexOf('" width')
        );

      var cachedContentHash = crypto
        .createHash("sha1")
        .update(fs.readFileSync(path))
        .digest("hex");
      var originalContentHash = crypto
        .createHash("sha1")
        .update(fs.readFileSync(__dirname + image))
        .digest("hex");

      expect(originalContentHash).toEqual(cachedContentHash);

      done();
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
      verifyCachedImage(blog, result);
      done();
    });
  });

  it("caches an image case-insensitively", function(done) {
    var path = "/tests-image.png";
    var html = '<img src="/nested/' + path.toUpperCase() + '">';
    var blog = this.blog;

    fs.copySync(__dirname + path, localPath(blog.id, '/nested' + path));

    render(blog, html, function(err, result) {
      expect(result).toContain(".png");
      expect(result).toContain("/_image_cache/");
      verifyCachedImage(blog, result);
      done();
    });
  });

  function verifyCachedImage(blog, result) {
    var stat;
    var cachedImagePath = result.slice(result.indexOf('"') + 1);

    cachedImagePath = cachedImagePath.slice(0, cachedImagePath.indexOf('"'));
    cachedImagePath = cachedImagePath.slice(config.cdn.origin.length);

    cachedImagePath = join(
      config.blog_static_files_dir,
      cachedImagePath
    );

    try {
      // Does the cached image exist on disk?
      stat = fs.statSync(cachedImagePath);
    } catch (e) {
      fail(e);
    }

    expect(stat.isFile()).toEqual(true);
  }

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
