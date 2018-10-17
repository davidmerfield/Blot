describe("template", function() {
  require("./setup")();

  var set = require("../set");
  var get = require("../get");

  it("gets a view", function(done) {
    var ctx = this;
    var name = this.fake.random.word();

    set(ctx.template.id, { name: name }, function(err) {
      if (err) return done.fail(err);
      get(ctx.template.id, name, function(err, view) {
        if (err) return done.fail(err);
        expect(view.name).toEqual(name);
        done();
      });
    });
  });
});
