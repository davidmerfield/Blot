describe("template", function() {
  require("./setup")();

  var set = require("../set");
  var checkViewIsStoredInRedis = require("./util/checkViewIsStoredInRedis");

  // test setting a view with invalid data structures
  
  it("sets a view", function(done) {
    var name = this.fake.random.word();
    var ctx = this;
    set(this.template.id, { name: name }, function(err) {
      if (err) return done.fail(err);
      checkViewIsStoredInRedis(ctx.template.id, name, done);
    });
  });
});
