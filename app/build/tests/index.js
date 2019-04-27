describe("build", function() {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.server(function(server) {
    // Only server an image at this route if 
    // the request passes the correct query
    server.get("/a.jpg", function(req, res) {
      if (!req.query || req.query.user !== "foo" || req.query.pass !== "bar")
        return res.sendStatus(400);

      res.sendFile(__dirname + "/small.jpg");
    });
  });

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

  it("handles image URLs with query strings", function(done) {
    var path = "/hello.txt";
    var contents = "![](" + this.origin + "/a.jpg?user=foo&pass=bar)";

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
});
