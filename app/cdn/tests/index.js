describe("cdn", function() {
  var request = require("request");
  var fs = require("fs-extra");
  var config = require("config");

  global.test.blog();

  global.test.server(function(server) {
    server.use("/", require("../index"));
  });

  it("exposes contents of static folder at CDN endpoint", function(done) {
    var path = "/small.jpg";

    fs.copySync(
      __dirname + path,
      config.blog_static_files_dir + "/" + this.blog.id + "/" + path
    );

    request(this.origin + "/cdn/" + this.blog.id + path, function(err, res) {
      expect(res.statusCode).toEqual(200);
      done();
    });
  });
});
