describe("allTags", function () {
  var allTags = require("blog/render/retrieve/allTags");
  var sync = require("sync");
  var fs = require("fs-extra");

  global.test.blog();

  beforeEach(function () {
    this.request = {
      protocol: "http",
      blog: this.blog,
      get: function () {
        return "example.com";
      },
    };
  });

  beforeEach(function (done) {
    sync(this.blog.id, (err, folder, callback) => {
      fs.outputFileSync(this.blogDirectory + "/foo.txt", "Tags: abc\n\nFoo");
      fs.outputFileSync(this.blogDirectory + "/bar.txt", "Tags: abc\n\nBar");
      folder.update("/foo.txt", function (err) {
        if (err) return callback(err, done);
        folder.update("/bar.txt", function (err) {
          if (err) return callback(err, done);
          callback(null, done);
        });
      });
    });
  });

  it("displays entries in chronological order", function (done) {
    allTags(this.request, function (err, tags) {
      expect(tags.length).toEqual(1);
      expect(tags[0].entries.length).toEqual(2);
      expect(tags[0].entries[0].name).toEqual("bar.txt");
      expect(tags[0].entries[1].name).toEqual("foo.txt");
      done();
    });
  });
});
