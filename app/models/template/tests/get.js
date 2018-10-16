describe("template", function() {
  require("./setup")({ createTemplate: true });

  var get = require("../get");

  it("gets a template", function(done) {
    get(this.template.id, function(err, template) {
      expect(err).toBeNull();
      expect(template).toEqual(jasmine.any(Object));
      done();
    });
  });
});
