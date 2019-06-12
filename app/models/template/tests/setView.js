describe("template", function() {
  require("./setup")({ createTemplate: true });

  var setView = require("../index").setView;
  var getView = require("../index").getView;

  it("sets a view", function(done) {
    var test = this;
    var view = {
      name: test.fake.random.word() + '.txt',
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

  it("sets changes to an existing view", function(done) {
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

        view.content = test.fake.random.word();

        setView(test.template.id, view, function(err) {
          if (err) return done.fail(err);

          getView(test.template.id, view.name, function(err, savedView) {
            if (err) return done.fail(err);
            expect(savedView.content).toEqual(view.content);
            done();
          });
        });
      });
    });
  });

  it("won't set a view with invalid mustache content", function(done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      content: "{{#x}}" // without the closing {{/x}} mustache will err.
    };

    setView(test.template.id, view, function(err) {
      expect(err instanceof Error).toBe(true);
      done();
    });
  });

  it("won't set a view against a template that does not exist", function(done) {
    var test = this;
    var view = { name: test.fake.random.word() };

    setView(test.fake.random.word(), view, function(err) {
      expect(err instanceof Error).toBe(true);
      done();
    });
  });

  // In future this should return an error to the callback, lol
  it("won't set a view with a name that is not a string", function() {
    var test = this;

    expect(function() {
      setView(test.template.id, { name: null }, function() {});
    }).toThrow();
  });
});
