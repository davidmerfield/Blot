fdescribe("template", function() {
  var read = require("../read");
  var fs = require("fs-extra");

  require("./setup")({ createTemplate: true });

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  it("reads a template from an empty folder", function(done) {
    read(this.blog.id, this.tmp, done);
  });

  fit("reads a template from a folder", function(done) {
    fs.outputFileSync(this.tmp + "/style.css", "body {color:pink}");

    fs.outputJsonSync(this.tmp + "/package.json", {
      locals: { foo: "bar" },
      views: { style: { url: "/style.css" } }
    });

    read(this.blog.id, this.tmp, function(err, template) {
      if (err) return done.fail(err);

      expect(template.locals.foo).toEqual("bar");
      done();
    });
  });
});
