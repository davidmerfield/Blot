fdescribe("template", function() {
  var read = require("../index").readFromFolder;
  var fs = require("fs-extra");
  var getViewByUrl = require("../index").getViewByURL;
  var get = require("../index").getView;

  require("./setup")({ createTemplate: true });

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  it("reads a template from an empty folder without error", function(done) {
    read(this.blog.id, this.tmp, done);
  });

  it("reads template properties from package.json", function(done) {
    fs.outputJsonSync(this.tmp + "/package.json", {
      locals: { foo: "bar" }
    });

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      expect(template.locals.foo).toEqual("bar");
      done();
    });
  });

  it("ignores view files which are too large", function(done) {
    // 3mb of random data should exceed the limit of 2.5mb
    fs.writeFileSync(
      this.tmp + "/style.css",
      require("crypto").randomBytes(3 * 1000 * 1000)
    );

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      getViewByUrl(template.id, "/style.css", function(err, name) {
        if (err) return done.fail(err);

        expect(name).toEqual(null);
        done();
      });
    });
  });

  it("reads a view's properties from package.json", function(done) {
    fs.outputFileSync(this.tmp + "/style.css", "body {color:pink}");
    fs.outputJsonSync(this.tmp + "/package.json", {
      locals: { foo: "bar" },
      views: { style: { url: "/test", locals: { baz: "bat" } } }
    });

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      getViewByUrl(template.id, "/test", function(err, name) {
        if (err) return done.fail(err);

        expect(name).toEqual("style");
        done();
      });
    });
  });

  it("assigns a view a URL automatically", function(done) {
    fs.outputFileSync(this.tmp + "/style.css", "body {color:pink}");

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      getViewByUrl(template.id, "/style.css", function(err, name) {
        if (err) return done.fail(err);

        expect(name).toEqual("style");
        done();
      });
    });
  });

  it("reads a view's content from a folder", function(done) {
    fs.outputFileSync(this.tmp + "/style.css", "body {color:pink}");

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      get(template.id, "style", function(err, view) {
        if (err) return done.fail(err);
        expect(view.content).toEqual("body {color:pink}");
        done();
      });
    });
  });
});
