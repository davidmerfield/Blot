describe("template", function() {
  require("./setup")({ createTemplate: true, createView: true });

  var dropView = require("../index").dropView;
  var getAllViews = require("../index").getAllViews;
  var client = require("client");

  it("drops a view", function(done) {
    dropView(this.blog.id, this.view.name, done);
  });

  it("dropView removes a view from the list of views", function(done) {
    var test = this;
    getAllViews(test.template.id, function(err, views) {
      if (err) return done.fail(err);
      expect(views[test.view.name].content).toEqual(test.view.content);
      dropView(test.template.id, test.view.name, function(err) {
        if (err) return done.fail(err);
        getAllViews(test.template.id, function(err, views) {
          if (err) return done.fail(err);
          expect(views).toEqual({});
          done();
        });
      });
    });
  });

  it("drop removes the key for the view", function(done) {
    var test = this;
    var searchPattern = "template:" + test.template.id + ":view:*";

    client.keys(searchPattern, function(err, result) {
      if (err) return done.fail(err);
      expect(result.length).toEqual(1);

      dropView(test.template.id, test.view.name, function(err) {
        if (err) return done.fail(err);

        client.keys(searchPattern, function(err, result) {
          if (err) return done.fail(err);

          expect(result).toEqual([]);
          done();
        });
      });
    });
  });

  // dropView does not remove the URL key for the view at the moment
  // so it might be worth writing a check against this in future...

  // This is not yet implemented
  xit("drop returns an error when the template does not exist", function(done) {
    var test = this;
    dropView(test.template.id, test.view.name, function(err) {
      expect(err instanceof Error).toBe(true);
      expect(err.code).toEqual("ENOENT");
      done();
    });
  });
});
