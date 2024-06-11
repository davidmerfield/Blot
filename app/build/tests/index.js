describe("build", function () {
  var build = require("../index");
  var fs = require("fs-extra");
  var express = require("express");
  var app = express();

  // Only serve a test image when query contains valid user and password
  app.get("/small.jpg", function (req, res) {
    if (req.query && req.query.user === "x" && req.query.pass === "y")
      res.sendFile(__dirname + "/small.jpg");
    else res.sendStatus(400);
  });

  app.get("/public.jpg", function (req, res) {
    res.sendFile(__dirname + "/small.jpg");
  });

  global.test.blog();

  global.test.server(app);

  beforeEach(function () {
    this.build = async (path, contents) => {
      return new Promise((resolve, reject) => {
        fs.outputFileSync(this.blogDirectory + path, contents);
        require("../index")(this.blog, path, {}, function (err, entry) {
          if (err) return reject(err);
          resolve(entry);
        });
      });
    };
  });

  it("handles image URLs with query strings", function (done) {
    // The test server defined above will only respond with an image if
    // the query string is preserved. I was running into an ampersand
    // encoding issue where the & was replaced with &amp;
    var contents = "<img src='" + this.origin + "/small.jpg?user=x&pass=y'/>";
    var path = "/hello.txt";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify the image was cached
      expect(entry.html).toContain("/_image_cache/");

      // verify a thumbnail was generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg",
        })
      );
      done();
    });
  });

  it("extracts tags from a file path", function (done) {
    const path = "/[foo]/[bar]/[baz].txt";
    const contents = "Hello";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, (err, entry) => {
      if (err) return done.fail(err);
      expect(entry.tags).toEqual(["foo", "bar", "baz"]);
      done();
    });
  });

  it("creates a page in a lowercase pages folder", function (done) {
    const path = "/pages/bar.txt";
    const contents = "# Hello";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, (err, entry) => {
      if (err) return done.fail(err);
      expect(entry.title).toEqual("Hello");
      expect(entry.page).toEqual(true);
      done();
    });
  });

  it("creates a page in an uppercase pages folder", function (done) {
    const path = "/Pages/far.txt";
    const contents = "# Hello";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, (err, entry) => {
      if (err) return done.fail(err);
      expect(entry.title).toEqual("Hello");
      expect(entry.page).toEqual(true);
      done();
    });
  });

  it("extracts tags with case from an optional path with case", function (done) {
    const path = "/[foo]/bar.txt";
    const pathDisplay = "/[Foo]/bar.txt";
    const contents = "Hello";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, { pathDisplay }, (err, entry) => {
      if (err) return done.fail(err);
      expect(entry.tags).toEqual(["Foo"]);
      done();
    });
  });

  it("includes inline code tags in the summary", function (done) {
    var path = "/hello.txt";
    var contents = "# Title\n\nThis `should` appear ```in``` the summary";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);
      expect(entry.summary).toEqual("This should appear in the summary");
      done();
    });
  });

  it("excludes block code tags in the summary", function (done) {
    var path = "/hello.txt";
    var contents = "# Title\n\n```\nNot in\n```\n\nthe summary";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);
      expect(entry.summary).toEqual("the summary");
      done();
    });
  });

  it("resolves relative paths inside files", function (done) {
    var path = "/blog/foo.txt";
    var contents = "![Image](_foo.jpg)";
    var absolutePathToImage = "/blog/_foo.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // It won't be cached since the image doesn't exist
      expect(entry.html).toContain(absolutePathToImage);
      done();
    });
  });

  it("generates a blog post from an image with quotes in its filename", function (done) {
    var pathToImage = '/Hell"o\'W "orld.jpg';

    fs.copySync(__dirname + "/small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, pathToImage, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify the image was cached
      expect(entry.html).toContain("/_image_cache/");

      // verify a thumbnail was generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg",
        })
      );

      done();
    });
  });

  it("handles images with accents and spaces in their filename", function (done) {
    var path = "/blog/Hello world.txt";
    var contents = "![Best Image Ever](óå g.jpg)";
    var pathToImage = "/blog/óå g.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);
    fs.copySync(__dirname + "/small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify the image was cached
      expect(entry.html).toContain("/_image_cache/");

      // verify a thumbnail was generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg",
        })
      );

      done();
    });
  });

  it("will handle empty metadata", function (done) {
    var path = "/Hello.txt";
    var contents = "Menu: \n\nHey";

    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      expect(entry.menu).toEqual(false);
      done();
    });
  });

  it("will not use as image to become a thumbnail if it is too small", function (done) {
    var path = "/Hello world.txt";
    var contents = "![Best Image Ever](test.jpg)";
    var pathToImage = "/test.jpg";

    fs.outputFileSync(this.blogDirectory + path, contents);
    fs.copySync(__dirname + "/too-small.jpg", this.blogDirectory + pathToImage);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify no thumbnail was generated from the image
      expect(entry.thumbnail).toEqual({});
      done();
    });
  });

  it("will not include caption text in summaries", function (done) {
    var path = "/Hello world.txt";
    var contents = "# Hello\n\n![Image caption](file.jpg)\n\nWorld";

    fs.outputFileSync(this.blogDirectory + path, contents);

    let blog = this.blog;
    blog.plugins.imageCaption.enabled = true;

    build(blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify a thumbnail was generated from the image
      expect(entry.summary).toEqual("World");

      done();
    });
  });

  it("will not generate a publish dateStamp for files without a date in their metadata or path", function (done) {
    var path = "/No-date-in-this-path.txt";
    var contents = "No date in this file";

    fs.outputFileSync(this.blogDirectory + path, contents);
    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);
      expect(entry.dateStamp).toEqual(undefined);
      done();
    });
  });

  it("will not cache image an image using the static query string", function (done) {
    var path = "/Hello world.txt";
    var contents = "<img src='" + this.origin + "/public.jpg?static=1'>";

    // we use an img tag instead of a markdown image because for
    // some reason the version of Pandoc running on Blot's CI server
    // creates <embed>'s instead of <img> for certain URLs
    fs.outputFileSync(this.blogDirectory + path, contents);

    build(this.blog, path, {}, function (err, entry) {
      if (err) return done.fail(err);

      // verify the image was not cached
      expect(entry.html).not.toContain("/_image_cache/");

      // verify a thumbnail was still generated from the image
      expect(entry.thumbnail.small).toEqual(
        jasmine.objectContaining({
          name: "small.jpg",
        })
      );

      done();
    });
  });

  it("will generate a list of internal links", async function (done) {
    const path = "/post.txt";
    const contents = "[linker](/linked)";
    const entry = await this.build(path, contents);

    expect(entry.internalLinks).toEqual(["/linked"]);
    done();
  });

  it("will generate an empty list of internal links", async function (done) {
    const path = "/post.txt";
    const contents = "Hey no link here.";
    const entry = await this.build(path, contents);

    expect(entry.internalLinks).toEqual([]);
    done();
  });
});
