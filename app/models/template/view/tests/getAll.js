describe("template", function() {
  require("./setup")();
  var async = require("async");
  var set = require("../set");
  var getAll = require("../getAll");

  it("gets all views", function(done) {
    var viewIDs = [];

    for (var i = 0; i < 10; i++) viewIDs.push(this.fake.random.word());

    var ctx = this;
    var setView = function(viewID, next) {
      set(ctx.template.id, { name: viewID }, next);
    };

    async.each(viewIDs, setView, function(err) {
      if (err) return done.fail(err);

      getAll(ctx.template.id, function(err, views) {
        if (err) return done.fail(err);
        expect(views).toEqual(jasmine.any(Array));
        expect(viewIDs.sort()).toEqual(
          views
            .map(function(view) {
              return view.name;
            })
            .sort()
        );
        done();
      });
    });
  });
});
