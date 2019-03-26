describe("blog creates", function() {
  // Create a test user before each spec
  global.test.user();

  // Clean up blogs created during tests
  afterEach(function(done) {
    if (this.blog) {
      require("../remove")(this.blog.id, done);
    } else {
      done();
    }
  });

  var create = require("../create");

  it("creates a blog", function(done) {
    var ctx = this;

    create(ctx.user.uid, { handle: "example" }, function(err, blog) {
      if (err) return done.fail(err);

      ctx.blog = blog;

      expect(blog).toEqual(jasmine.any(Object));
      done();
    });
  });

  it("adds created blog to list of all blogs", function(done) {
    var ctx = this;

    create(ctx.user.uid, { handle: "example" }, function(err, blog) {
      if (err) return done.fail(err);

      ctx.blog = blog;

      expect(blog).toEqual(jasmine.any(Object));
      done();
    });
  });
});
