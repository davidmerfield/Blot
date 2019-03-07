describe("template", function() {
  var read = require("../read");
  var fs = require("fs-extra");
  var getNameByUrl = require("../view/getNameByUrl");
  var get = require("../view/get");

  require("./setup")({ createTemplate: true });

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  it("reads a template from an empty folder", function(done) {
    read(this.blog.id, this.tmp, done);
  });

  it("reads a template from a folder", function(done) {
    fs.outputFileSync(this.tmp + "/style.css", "body {color:pink}");

    fs.outputJsonSync(this.tmp + "/package.json", {
      locals: { foo: "bar" },
      views: { style: { url: "/style.css", locals: { baz: "bat" } } }
    });

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      expect(template.locals.foo).toEqual("bar");

      getNameByUrl(template.id, "/style.css", function(err, name) {
        if (err) return done.fail(err);

        expect(name).toEqual("style");

        get(template.id, name, function(err, view) {
          if (err) return done.fail(err);
          expect(view.locals.baz).toEqual("bat");
          done();
        });
      });
    });
  });
});
