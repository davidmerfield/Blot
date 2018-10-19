describe("template", function() {
  var read = require("../read");
  var fs = require("fs-extra");

  require("./setup")({ createTemplate: true });

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  it("reads a template from an empty folder", function(done) {
    read(this.blog.id, this.tmp, done);
  });

  it("reads a template from a folder", function(done) {
    fs.outputJsonSync(this.tmp + "/package.json", {
      locals: { foo: "bar" }
    });

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      expect(template.locals.foo).toEqual("bar");
      done();
    });
  });

  it("reads a folder full of template folders", function(done) {
    fs.outputJsonSync(
      this.tmp + "/" + this.fake.random.word() + "package.json",
      {
        locals: { foo: "bar" }
      }
    );

    fs.outputJsonSync(
      this.tmp + "/" + this.fake.random.word() + "package.json",
      {
        locals: { foo: "bar" }
      }
    );

    read.all(this.blog.id, this.tmp, function(err, templates) {
      if (err) return done.fail(err);

      templates.forEach(function(template) {
        expect(template.locals.foo).toEqual("bar");
      });

      done();
    });
  });
});
