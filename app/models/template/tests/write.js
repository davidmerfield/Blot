

xdescribe("template", function() {
  
  var write = require("../index").write;
  var setView = require("../index").setView;
  var fs = require("fs");

  require("./setup")({ createTemplate: true });

  it("writes a template to a folder", function(done) {
    var test = this;
    var view = {
      name: test.fake.random.word(),
      content: test.fake.random.word()
    };
    var path =
      test.blogDirectory +
      "/Templates/" +
      test.template.slug +
      "/" +
      view.name +
      ".html";
    setView(this.template.id, view, function(err) {
      if (err) return done.fail(err);

      write(test.blog.id, test.template.id, function(err) {
        if (err) return done.fail(err);
        expect(fs.readFileSync(path, "utf-8")).toEqual(view.content);
        done();
      });
    });
  });
});
