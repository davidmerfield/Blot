describe("template", function () {
  require("./setup")({ createTemplate: true });

  var setMetadata = require("../index").setMetadata;
  var getMetadata = require("../index").getMetadata;
  var Blog = require("models/blog");

  it("sets a template's metadata", function (done) {
    var test = this;
    var updates = { description: test.fake.random.word() };
    setMetadata(test.template.id, updates, function (err) {
      if (err) return done.fail(err);
      getMetadata(test.template.id, function (err, template) {
        if (err) return done.fail(err);
        expect(template.description).toEqual(updates.description);
        done();
      });
    });
  });

  it("updates the cache ID of the blog which owns a template after updating", function (done) {
    var test = this;
    var initialCacheID = test.blog.cacheID;
    var updates = { description: test.fake.random.word() };
    setMetadata(test.template.id, updates, function (err) {
      if (err) return done.fail(err);
      Blog.get({ id: test.template.owner }, function (err, blog) {
        if (err) return done.fail(err);
        expect(blog.cacheID).not.toEqual(initialCacheID);
        done();
      });
    });
  });
});
