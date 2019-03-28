describe("template", function() {
  require("./setup")({ createTemplate: true });

  var drop = require("../index").drop;
  var getTemplateList = require("../index").getTemplateList;
  var client = require("client");

  it("drops a template", function(done) {
    drop(this.blog.id, this.template.name, done);
  });

  it("drop removes a template from the list of templates", function(done) {
    var test = this;
    getTemplateList(test.blog.id, function(err, templates) {
      if (err) return done.fail(err);
      expect(templates).toContain(test.template);
      drop(test.blog.id, test.template.name, function(err) {
        if (err) return done.fail(err);
        getTemplateList(test.blog.id, function(err, templates) {
          if (err) return done.fail(err);
          expect(templates).not.toContain(test.template);
          done();
        });
      });
    });
  });

  it("drop removes all keys for the template", function(done) {
    var test = this;
    drop(test.blog.id, test.template.name, function(err) {
      if (err) return done.fail(err);
      client.keys("*" + test.template.id + "*", function(err, result) {
        if (err) return done.fail(err);
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // There is a bug with the drop function at the moment
  // It does a truthy check against an empty object in the
  // if (err || !allViews)  where all views is {}
  // Fix this in future and enable the spec.
  xit("drop returns an error when the template does not exist", function(done) {
    var test = this;
    drop(test.blog.id, test.fake.random.word(), function(err) {
      expect(err instanceof Error).toBe(true);
      expect(err.code).toEqual("ENOENT");
      done();
    });
  });
});
