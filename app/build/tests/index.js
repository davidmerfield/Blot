describe("build", function() {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  it("resolves relative paths inside files", function(done) {
    var path = "/blog/foo.txt";
    var contents = "![Image](_foo.jpg)";
    var absolutePathToImage = "/blog/_foo.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      // It won't be cached since the image doesn't exist
      expect(entry.html).toContain(absolutePathToImage);
      done();
    });
  });

  it("handles images with accents in their filename correctly", function(done) {
    var path = "/blog/Hello world.txt";
    var contents = "![Best Image Ever](ómg.jpg)";
    var pathToImage = "/blog/ómg.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);
    fs.copySync(__dirname + "/small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      // verify the image was cached
      expect(entry.html).toContain("/_image_cache/");

      // verify a thumbnail was generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg"
        })
      );

      done();
    });
  });

  it("handles images with spaces in their filename correctly", function(done) {
    var path = "/blog/Hello world.txt";
    var contents = "![Best Image Ever](_gomorgen danmark.jpg)";
    var pathToImage = "/blog/_gomorgen danmark.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);
    fs.copySync(__dirname + "/small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      // verify the image was cached
      expect(entry.html).toContain("/_image_cache/");

      // verify a thumbnail was generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg"
        })
      );
      done();
    });
  });

  it("handles images with spaces and accents in their filename correctly", function(done) {
    var path = "/blog/Hello world.txt";
    var contents = "![Best Image Ever](_på besøg hos gomorgen danmark.jpg)";
    var pathToImage = "/blog/_på besøg hos gomorgen danmark.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);
    fs.copySync(__dirname + "/small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      // verify the image was cached
      expect(entry.html).toContain("/_image_cache/");

      // verify a thumbnail was generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg"
        })
      );
      done();
    });
  });
});
