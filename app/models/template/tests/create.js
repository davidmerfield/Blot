var Template = require("../index");

describe("template", function() {
  require("./setup")();

  it("creates a template", function(done) {
    Template.create(this.blog.id, this.fake.random.word(), {}, done);
  });

  it("clones a template", function(done) {
    var ctx = this;
    var blogID = ctx.blog.id;
    var original = this.fake.random.word();
    var cloned = this.fake.random.word();
    var description = this.fake.random.word();

    Template.create(blogID, original, { description: description }, function(
      err,
      originalTemplate
    ) {
      if (err) return done.fail(err);

      Template.create(
        blogID,
        cloned,
        { cloneFrom: originalTemplate.id },
        function(err, clonedTemplate) {
          if (err) return done.fail(err);

          Template.get(clonedTemplate.id, function(err, template) {
            if (err) return done.fail(err);
            expect(originalTemplate.description).toEqual(
              clonedTemplate.description
            );
            done();
          });
        }
      );
    });
  });
});
