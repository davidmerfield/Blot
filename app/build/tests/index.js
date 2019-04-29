describe("build", function() {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  // Only serve a test image when query contains valid user and password
  global.test.server(function(server) {
    server.get("/small.jpg", function(req, res) {
      if (req.query && req.query.user === "x" && req.query.pass === "y")
        res.sendFile(__dirname + "/small.jpg");
      else res.sendStatus(400);
    });

    server.get("/public.jpg", function(req, res) {
      res.sendFile(__dirname + "/small.jpg");
    });
  });

  it("handles image URLs with query strings", function(done) {
    // The test server defined above will only respond with an image if
    // the query string is preserved. I was running into an ampersand
    // encoding issue where the & was replaced with &amp;
    var contents = "<img src='" + this.origin + "/small.jpg?user=x&pass=y'/>";
    var path = "/hello.txt";

    fs.outputFileSync(this.blogDirectory + path, contents);

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

  it("handles images with accents and spaces in their filename", function(done) {
    var path = "/blog/Hello world.txt";
    var contents = "![Best Image Ever](óå g.jpg)";
    var pathToImage = "/blog/óå g.jpg";

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

  it("will not cache image an image using the static query string", function(done) {
    var path = "/Hello world.txt";
    var contents = "<img src='" + this.origin + "/public.jpg?static=1'>";

    // we use an img tag instead of a markdown image because for
    // some reason the version of Pandoc running on Blot's CI server
    // creates <embed>'s instead of <img> for certain URLs
    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function(err, entry) {
      if (err) return done.fail(err);

      // verify the image was not cached
      expect(entry.html).not.toContain("/_image_cache/");

      // verify a thumbnail was still generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg"
        })
      );

      done();
    });
  });
});
