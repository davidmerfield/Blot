describe("template", function() {
  require("./setup")();

  var set = require("../set");
  var drop = require("../drop");
  var checkViewIsNotInRedis = require("./util/checkViewIsNotInRedis");

  it("drops a view", function(done) {
    var ctx = this;
    var viewID = ctx.fake.random.word();
    set(ctx.template.id, { name: viewID }, function(err) {
      if (err) return done.fail(err);
      drop(ctx.template.id, viewID, function(err) {
        if (err) return done.fail(err);
        checkViewIsNotInRedis(ctx.template.id, viewID, done);
      });
    });
  });
});

