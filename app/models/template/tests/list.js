describe("list", function() {
  require("./setup")({ createTemplate: true });

  var list = require("../list");

  it("lists all templates", function(done) {
    var test = this;
    list(test.blog.id, function(err, result) {
      if (err) return done.fail(err);
      expect(result).toEqual(jasmine.any(Array));
      expect(result).toContain(test.template);
      done();
    });
  });

  it("does not return an error if the owner does not exist", function(done) {
    list(test.fake.random.word(), function(err, result) {
      if (err) return done.fail(err);
      expect(result).toEqual(jasmine.any(Array));
      done();
    });
  });
});
