describe("template", function() {
  var writeToFolder = require("../index").writeToFolder;
  var setView = require("../index").setView;
  var setMetadata = require("../index").setMetadata;
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

  it("writes template metadata to package.json in a folder", function(done) {
    var test = this;
    var metadata = { locals: { foo: "bar" } };
    var path =
      test.clientDir + "/Templates/" + test.template.slug + "/package.json";

    setMetadata(this.template.id, metadata, function(err) {
      if (err) return done.fail(err);

      writeToFolder(test.blog.id, test.template.id, function(err) {
        if (err) return done.fail(err);
        expect(fs.readJsonSync(path).locals).toEqual(metadata.locals);
        done();
      });
    });
  });
});
