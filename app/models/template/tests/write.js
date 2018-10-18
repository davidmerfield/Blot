describe("template", function() {
  var write = require("../write");
  var setView = require("../view/set");
  var fs = require("fs");

  require("./setup")({ createTemplate: true });

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  beforeEach(function(done) {
    var test = this;
    require("blog").set(test.blog.id, { client: "local" }, function(err) {
      if (err) return done(err);
      console.log("setting up test folder for", test.tmp);
      require("clients").local.setup(test.blog.id, test.tmp, done);
    });
  });

  it("writes a template to a folder", function(done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      content: test.fake.random.word()
    };

    setView(this.template.id, view, function(err) {
      if (err) return done.fail(err);

      write(test.blog.id, test.template.id, function(err) {
        if (err) return done.fail(err);
        expect(fs.readdirSync(test.tmp)).toEqual(["Templates"]);
        expect(fs.readdirSync(test.tmp + "/Templates")).toEqual([
          test.template.name
        ]);
        expect(
          fs.readdirSync(test.tmp + "/Templates/" + test.template.name)
        ).toEqual([view.name + '.html']);
        done();
      });
    });
  });
});
