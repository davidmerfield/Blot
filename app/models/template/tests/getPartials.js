describe("template", function () {
  require("./setup")({ createTemplate: true, createView: true });

  var getPartials = require("../index").getPartials;
  var setView = require("../index").setView;

  it("gets a partials for a view", function (done) {
    var test = this;
    var partials = {};

    partials[test.view.name] = "";

    getPartials(test.blog.id, test.template.id, partials, function (
      err,
      partials,
      retrieve
    ) {
      if (err) return done.fail(err);
      expect(partials[test.view.name]).toEqual(test.view.content);
      done();
    });
  });

  // If you have a template view 'header.html' which embeds
  // the partial view 'nav.html', when you get the partials
  // for header.html, you should recieve nav.html too.
  it("retrieves partial used in a partial", function (done) {
    var test = this;

    // We create a second view which embeds the view
    // already created for this spec. When we call
    // Template.getPartials for the second view, we
    // expect to receive both the second view's contents
    // and the contents of the view already created.
    var parentView = {
      name: "Another " + test.fake.random.word(),
      content: "{{> " + test.view.name + "}}",
    };

    var partials = {};

    partials[parentView.name] = "";

    setView(test.template.id, parentView, function (err) {
      if (err) return done.fail(err);
      getPartials(test.blog.id, test.template.id, partials, function (
        err,
        partials,
        retrieve
      ) {
        if (err) return done.fail(err);
        expect(partials[test.view.name]).toEqual(test.view.content);
        expect(partials[parentView.name]).toEqual(parentView.content);

        done();
      });
    });
  });

  // Don't get caught in an infinite loop if partial x.html embeds
  // partial y.html and partial y.html embeds partial x.html
  it("retrieves partial which embed each other", function (done) {
    var test = this;

    // We create a second view which embeds the view
    // already created for this spec. When we call
    // Template.getPartials for the second view, we
    // expect to receive both the second view's contents
    // and the contents of the view already created.

    var xName = "X " + test.fake.random.word();
    var yName = "Y " + test.fake.random.word();

    var xView = {
      name: xName,
      content: "{{> " + yName + "}}",
    };

    var yView = {
      name: yName,
      content: "{{> " + xName + "}}",
    };

    var partials = {};

    partials[xName] = "";

    setView(test.template.id, xView, function (err) {
      if (err) return done.fail(err);

      setView(test.template.id, yView, function (err) {
        if (err) return done.fail(err);

        getPartials(test.blog.id, test.template.id, partials, function (
          err,
          partials,
          retrieve
        ) {
          if (err) return done.fail(err);
          expect(partials[xName]).toEqual(xView.content);
          expect(partials[yName]).toEqual(yView.content);

          done();
        });
      });
    });
  });
});
