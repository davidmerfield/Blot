describe("template", function() {
  require("./setup")({ createTemplate: true });

  var setView = require("../index").setView;
  var getView = require("../index").getView;

  it("sets a view", function(done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      content: test.fake.random.word()
    };

    setView(test.template.id, view, function(err) {
      if (err) return done.fail(err);
      getView(test.template.id, view.name, function(err, savedView) {
        if (err) return done.fail(err);
        expect(savedView.name).toEqual(view.name);
        expect(savedView.content).toEqual(view.content);
        done();
      });
    });
  });
});
