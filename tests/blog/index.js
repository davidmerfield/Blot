describe("blog", function () {
  var Blog = require("models/blog");

  global.test.blog();

  it("creates and deletes a blog", function (done) {
    Blog.create(this.user.uid, {}, function (err, blog) {
      if (err) return done.fail(err);

      expect(blog).toEqual(jasmine.any(Object));

      Blog.remove(blog.id, function (err) {
        if (err) return done.fail(err);
        done();
      });
    });
  });
});
