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
    var contents = "![Best Image Ever](óåg.jpg)";
    var pathToImage = "/blog/óåg.jpg";

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
    var contents = "![Best Image Ever](_hey there.jpg)";
    var pathToImage = "/blog/_hey there.jpg";

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
    var test = this;
    var path = "/blog/Hello world.txt";
    var contents = "![Best Image Ever](_på be.jpg)";
    var pathToImage = "/blog/_på be.jpg";

    console.log('writing', this.blogDirectory + path);
    fs.outputFileSync(this.blogDirectory + path, contents);
    console.log('copying', __dirname + "/small.jpg", this.blogDirectory + pathToImage);
    fs.copySync(__dirname + "/small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      console.log('Entry.html:', entry.html);
      console.log("Directory state:");
      console.log(test.blogDirectory, fs.readdirSync(test.blogDirectory));
      console.log(
        test.blogDirectory + "/blog",
        fs.readdirSync(test.blogDirectory + "/blog")
      );

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
