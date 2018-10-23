describe("template", function() {
  require("./setup")({ createTemplate: true });

  var drop = require("../drop");
  var list = require("../list");
  var client = require("client");

  it("drops a template", function(done) {
    drop(this.template.id, done);
  });

  it("drop removes a template from the list of templates", function(done) {
    var test = this;
    drop(test.template.id, function(err) {
      if (err) return done.fail(err);
      list(test.blog.id, function(err, templates) {
        if (err) return done.fail(err);
        expect(
          templates.some(function(template) {
            return template.id === test.template.id;
          })
        ).toEqual(false);
        done();
      });
    });
  });

  it("drop removes all keys for the template", function(done) {
    var test = this;
    drop(test.template.id, function(err) {
      if (err) return done.fail(err);
      client.keys("*" + test.template.id + "*", function(err, result) {
        if (err) return done.fail(err);
        expect(result).toEqual([]);
        done();
      });
    });
  });

  it("drop returns an error when the template does not exist", function(done) {
    var test = this;
    drop(test.fake.random.word(), function(err) {
      expect(err instanceof Error).toBe(true);
      expect(err.code).toEqual("ENOENT");
      done();
    });
  });
});
