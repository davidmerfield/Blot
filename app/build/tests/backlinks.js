describe("build", function () {
  var build = require("../index");
  var fs = require("fs-extra");

  global.test.blog();

  // Only serve a test image when query contains valid user and password
  global.test.server(function (server) {
    server.get("/small.jpg", function (req, res) {
      if (req.query && req.query.user === "x" && req.query.pass === "y")
        res.sendFile(__dirname + "/small.jpg");
      else res.sendStatus(400);
    });

    server.get("/public.jpg", function (req, res) {
      res.sendFile(__dirname + "/small.jpg");
    });
  });

  it("will generate a list of internal links", function (done) {
    var path = "/Hello world.txt";
    var contents = "[Hey](/link), [you](/other), [that](http://example.org)";

    fs.outputFileSync(this.blogDirectory + path, contents);

    let blog = this.blog;

    build(blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify a thumbnail was generated from the image
      expect(entry.internalLinks).toEqual(["/link", "/other"]);
      done();
    });
  });
});
