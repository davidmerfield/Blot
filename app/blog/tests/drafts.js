describe("draft middleware", function() {
  var http = require("http");

  it("sends a draft in the blog folder", function(done) {
    done();
  });

  global.test.blog();

  global.test.server(function(server) {
    var ctx = this;

    server.use(function(req, res, next) {
      req.blog = ctx.blog;
      next();
    });

    server.use(require("../draft"));
  });

  beforeAll(function() {
    var url = this.origin;
    this.get = function(path, callback) {
      var contents = "";
      http
        .get(url + path, function(resp) {
          resp.setEncoding("utf8");
          resp.on("data", function(chunk) {
            contents += chunk;
          });
          resp.on("end", function() {
            callback(null, contents, resp);
          });
        })
        .on("error", callback);
    };
  });
});
