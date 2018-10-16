describe("template", function() {
  require("./setup")();

  var get = require("../get");
  var create = require("../create");

  beforeEach(function(done) {
    var ctx = this;
    create(ctx.blog.id, ctx.fake.random.word(), {}, function(err, template) {
      if (err) return done(err);
      ctx.template = template;
      done();
    });
  });

  it("gets a template", function(done) {
    get(this.template.id, function(err, template) {
      expect(err).toBeNull();
      expect(template).toEqual(jasmine.any(Object));
      done();
    });
  });
});
