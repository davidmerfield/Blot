describe("template", function() {
  require("./setup")();

  var set = require("../set");
  var getNameByUrl = require("../getNameByUrl");

  it("gets a view name by url", function(done) {
    var ctx = this;
    var name = this.fake.random.word();
    // this fails with uppercase characters...
    var url = "/" + this.fake.random.word();

    set(ctx.template.id, { name: name, url: url }, function(err) {
      if (err) return done.fail(err);
      getNameByUrl(ctx.template.id, url, function(err, viewName) {
        if (err) return done.fail(err);
        expect(name).toEqual(viewName);
        done();
      });
    });
  });
});
