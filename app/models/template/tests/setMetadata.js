describe("template", function() {
  require("./setup")({ createTemplate: true });

  var setMetadata = require("../index").setMetadata;
  var getMetadata = require("../index").getMetadata;

  it("sets a template's metadata", function(done) {
    var test = this;
    var updates = { description: test.fake.random.word() };
    setMetadata(test.template.id, updates, function(err) {
      if (err) return done.fail(err);
      getMetadata(test.template.id, function(err, template) {
        if (err) return done.fail(err);
        expect(template.description).toEqual(updates.description);
        done();
      });
    });
  });
});
