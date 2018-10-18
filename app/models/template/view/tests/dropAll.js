describe("template", function() {
  require("./setup")();

  var set = require("../set");
  var dropAll = require("../dropAll");
  var async = require("async");
  var key = require("../key");
  var checkViewIsNotInRedis = require("./util/checkViewIsNotInRedis");

  it("drops all views", function(done) {
    var viewIDs = [];

    for (var i = 0; i < 10; i++) viewIDs.push(this.fake.random.word());

    var ctx = this;
    var check = checkViewIsNotInRedis.bind(null, ctx.template.id);
    var setView = function(viewID, next) {
      set(ctx.template.id, { name: viewID }, next);
    };

    async.each(viewIDs, setView, function(err) {
      if (err) return done.fail(err);

      dropAll(ctx.template.id, function(err) {
        if (err) return done.fail(err);

        async.each(viewIDs, check, done);
      });
    });
  });
});
