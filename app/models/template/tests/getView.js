describe("template", function () {
  require("./setup")({ createTemplate: true, createView: true });

  var getView = require("../index").getView;

  it("gets a view", function (done) {
    var test = this;
    getView(test.template.id, test.view.name, function (err, savedView) {
      if (err) return done.fail(err);
      expect(savedView.name).toEqual(test.view.name);
      expect(savedView.content).toEqual(test.view.content);
      done();
    });
  });

  it("returns an error for a non-existent view", function (done) {
    var test = this;
    getView(test.template.id, "", function (err, savedView) {
      expect(err instanceof Error).toBe(true);
      expect(savedView).toBeFalsy();
      done();
    });
  });

  it("returns an error for a non-existent template", function (done) {
    var test = this;
    getView("", test.view.name, function (err, savedView) {
      expect(err instanceof Error).toBe(true);
      expect(savedView).toBeFalsy();
      done();
    });
  });
});
