describe("list", function() {
  require("./setup")({ createTemplate: true });

  var list = require("../list");
  var drop = require("../drop");

  it("lists all templates", function(done) {
    var ctx = this;
    list(ctx.blog.id, function(err, result) {
      if (err) return done.fail(err);
      expect(result).toEqual(jasmine.any(Array));
      expect(result).toContain(ctx.template);
      done();
    });
  });

  it("does not show a removed template", function(done) {
    var ctx = this;

    drop(ctx.template.id, function(err) {
      if (err) return done.fail(err);
      list(ctx.blog.id, function(err, result) {
        if (err) return done.fail(err);
        expect(result).toEqual(jasmine.any(Array));
        expect(result).not.toContain(ctx.template);
        done();
      });
    });
  });
});
