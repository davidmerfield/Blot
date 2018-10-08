var Template = require("../index");

describe("template", function() {
  require("./setup")();

  it("creates a template", function(done) {
    Template.create(this.blog.id, this.fake.random.word(), {}, function(err) {
      if (err) return done.fail(err);

      done();
    });
  });
});
