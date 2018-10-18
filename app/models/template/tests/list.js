describe("list", function() {
  require("./setup")({ createTemplate: true });

  var list = require("../list");
  var drop = require("../drop");

  it("lists all templates", function(done) {
    var test = this;
    list(test.blog.id, function(err, result) {
      if (err) return done.fail(err);
      expect(result).toEqual(jasmine.any(Array));
      expect(result).toContain(test.template);
      done();
    });
  });

  it("does not show a removed template", function(done) {
    var test = this;

    drop(test.template.id, function(err) {
      if (err) return done.fail(err);
      list(test.blog.id, function(err, result) {
        if (err) return done.fail(err);
        expect(result).toEqual(jasmine.any(Array));
        expect(result).not.toContain(test.template);
        done();
      });
    });
  });
});
