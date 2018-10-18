describe("template", function() {
  require("./setup")({ createTemplate: true });

  var drop = require("../drop");
  var client = require("client");

  it("drops a template", function(done) {
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
});
