describe("asset middleware", function() {
  var Express = require("express");
  var fs = require("fs-extra");
  var http = require("http");
  var config = require("config");

  it("sends a file in the blog folder", function(done) {
    var path = this.fake.path(".txt");
    var contents = this.fake.file();

    fs.outputFileSync(this.blogDirectory + path, contents);
    this.get(path, function(err, res) {
      expect(err).toBeNull();
      expect(res).toEqual(contents);
      done();
    });
  });

  it("sends a file in the static folder for this blog", function(done) {
    var path = this.fake.path(".txt");
    var contents = this.fake.file();

    fs.outputFileSync(
      config.blog_static_files_dir + "/" + this.blog.id + path,
      contents
    );
    this.get(path, function(err, res) {
      expect(err).toBeNull();
      expect(res).toEqual(contents);
      done();
    });
  });

  it("sends a file in the global static folder", function(done) {
    this.get("/robots_deny.txt", function(err, res) {
      expect(err).toBeNull();
      expect(res).toEqual(
        fs.readFileSync(__dirname + "/../static/robots_deny.txt", "utf-8")
      );
      done();
    });
  });

  global.test.blog();

  afterEach(function(done) {
    this.server.close(done);
  });

  beforeEach(function() {
    this.fake = global.test.fake;
  });

  beforeEach(function(done) {
    var ctx = this;

    (function attempt(done) {
      var port = 10000 + Math.round(Math.random() * 10000);
      ctx.server = Express();
      // load in assets route
      ctx.server.use(function(req, res, next) {
        req.blog = ctx.blog;
        next();
      });

      ctx.server.use(require("../assets"));
      ctx.server = ctx.server.listen(port, function(err) {
        if (err && err.code === "EADDRINUSE") return attempt(done);
        if (err && err.code === "EACCESS") return attempt(done);
        if (err) return done(err);
        done();
      });
      ctx.server.port = port;
      ctx.url = "http://localhost:" + port;
    })(done);
  });

  beforeEach(function() {
    var url = this.url;
    this.get = function(path, callback) {
      var contents = "";
      http
        .get(url + path, function(resp) {
          resp.setEncoding("utf8");
          resp.on("data", function(chunk) {
            contents += chunk;
          });
          resp.on("end", function() {
            callback(null, contents);
          });
        })
        .on("error", callback);
    };
  });
});
