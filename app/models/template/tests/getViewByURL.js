describe("template", function () {
  require("./setup")({ createTemplate: true });

  var setView = require("../index").setView;
  var getViewByURL = require("../index").getViewByURL;

  it("gets a view by a lowercase URL", function (done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      url: "/xyz", // this should be random in future
    };

    setView(test.template.id, view, function (err) {
      if (err) return done.fail(err);
      getViewByURL(test.template.id, view.url, function (err, viewName) {
        if (err) return done.fail(err);
        expect(viewName).toEqual(view.name);
        done();
      });
    });
  });

  // This fails because of a bug in the order of the processing
  // of view.url in setView. It determines the redis key before
  // normalizing the Url property of the view for storage...
  xit("gets a view by a lowercase URL without slash", function (done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      url: test.fake.random.word().toLowerCase(),
    };

    setView(test.template.id, view, function (err) {
      if (err) return done.fail(err);
      getViewByURL(test.template.id, view.url, function (err, viewName) {
        if (err) return done.fail(err);
        expect(viewName).toEqual(view.name);
        done();
      });
    });
  });

  // This fails because of a bug in the order of the processing
  // of view.url in setView. It determines the redis key before
  // normalizing the Url property of the view for storage...
  xit("gets a view by an uppercase URL", function (done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      url: "/" + test.fake.random.word().toUpperCase(),
    };

    setView(test.template.id, view, function (err) {
      if (err) return done.fail(err);
      getViewByURL(test.template.id, view.url, function (err, viewName) {
        if (err) return done.fail(err);
        expect(viewName).toEqual(view.name);
        done();
      });
    });
  });

  // This just returns an empty view
  xit("returns an error for a non-existent URL", function (done) {
    var test = this;
    getViewByURL(test.template.id, "", function (err, viewName) {
      expect(err instanceof Error).toBe(true);
      expect(viewName).toBe(null);
      done();
    });
  });
});
