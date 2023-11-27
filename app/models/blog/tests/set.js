describe("Blog.set", function () {
  var set = require("../set");

  global.test.blog();

  it("will set the domain", function (done) {
    var test = this;
    var domain = "example.com";

    set(test.blog.id, { domain: domain }, function (err) {
      if (err) return done.fail(err);

      done();
    });
  });
});
