// TODO add test to ensure case-sensitive lowercase paths
// work because dev machine has case-insensitive file-system
// but test server and production server do not.

describe("thumbnail", function() {
  global.test.blog();
  global.test.tmp();

  var localPath = require("helper").localPath;
  var fs = require("fs-extra");

  it("creates thumbnails", function(done) {
    var thumbnail = require("../index");
    var metadata = {};
    var imagePath = "/portrait.jpg";
    var html = '<img src="' + imagePath + '">';
    var path = "/post.txt";

    fs.copyFileSync(
      __dirname + "/images/" + imagePath,
      localPath(this.blog.id, imagePath)
    );

    thumbnail(this.blog, path, metadata, html, function(err, result) {
      expect(err).toBe(null);
      expect(result).toEqual(jasmine.any(Object));
      expect(result.small).toEqual(jasmine.any(Object));

      done();
    });
  });

  it("does not create thumbnails if there are none", function(done) {
    var thumbnail = require("../index");
    var metadata = {};
    var html = "<p>Hello, world!</p>";
    var path = "/post.txt";

    thumbnail(this.blog, path, metadata, html, function(err, result) {
      expect(err).toBe(null);
      expect(result).toBe(null);

      done();
    });
  });
});
