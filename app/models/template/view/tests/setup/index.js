module.exports = function setup(options) {
  options = options || {};

  // Create test blog before each test and remove it after
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });

  // Create a test templ;ate
  beforeEach(function(done) {
    var ctx = this;
    require("../../../create")(ctx.blog.id, ctx.fake.random.word(), {}, function(err, template) {
      if (err) return done(err);
      ctx.template = template;
      done();
    });
  });
};
