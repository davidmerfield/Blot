describe("template", function() {
  var writeToFolder = require("../index").writeToFolder;
  var setView = require("../index").setView;
  var fs = require("fs-extra");

  require("./setup")({ createTemplate: true });

  it("writes a template to a folder", function(done) {
    var test = this;
    var view = {
      name: test.fake.random.word() + ".html",
      content: test.fake.random.word()
    };
    var path =
      test.clientDir + "/Templates/" + test.template.slug + "/" + view.name;

    setView(this.template.id, view, function(err) {
      if (err) return done.fail(err);

      writeToFolder(test.blog.id, test.template.id, function(err) {
        if (err) return done.fail(err);
        expect(fs.readFileSync(path, "utf-8")).toEqual(view.content);
        done();
      });
    });
  });
});
