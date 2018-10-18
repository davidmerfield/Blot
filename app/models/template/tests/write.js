describe("template", function() {
  var write = require("../write");
  var setView = require("../view/set");
  var fs = require("fs");

  require("./setup")({ createTemplate: true });

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
        expect(fs.readdirSync(test.blogDirectory)).toEqual(["Templates"]);
        expect(fs.readdirSync(test.blogDirectory + "/Templates")).toEqual([
          test.template.name
        ]);
        expect(
          fs.readdirSync(test.blogDirectory + "/Templates/" + test.template.name)
        ).toEqual([view.name + ".html"]);
        done();
      });
    });
  });
});
