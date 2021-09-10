describe("template", function () {
  require("./setup")({ createTemplate: true });

  var drop = require("../index").drop;
  var getTemplateList = require("../index").getTemplateList;
  var client = require("client");
  var Blog = require("blog");

  it("drops a template", function (done) {
    drop(this.blog.id, this.template.name, done);
  });

  it("drop removes a template from the list of templates", function (done) {
    var test = this;
    getTemplateList(test.blog.id, function (err, templates) {
      if (err) return done.fail(err);
      expect(templates).toContain(test.template);
      drop(test.blog.id, test.template.name, function (err) {
        if (err) return done.fail(err);
        getTemplateList(test.blog.id, function (err, templates) {
          if (err) return done.fail(err);
          expect(templates).not.toContain(test.template);
          done();
        });
      });
    });
  });

  it("drop removes the URL key for a view in the template", function (done) {
    var test = this;
    var view = {
      name: test.fake.random.word() + ".txt",
      content: test.fake.random.word(),
      url: "/" + test.fake.random.word(),
    };

    require("../index").setView(test.template.id, view, function (err) {
      if (err) return done.fail(err);
      drop(test.blog.id, test.template.name, function (err) {
        if (err) return done.fail(err);
        client.keys("*" + test.template.id + "*", function (err, result) {
          if (err) return done.fail(err);
          expect(result).toEqual([]);
          done();
        });
      });
    });
  });

  it("drop removes all keys for the template", function (done) {
    var test = this;
    drop(test.blog.id, test.template.name, function (err) {
      if (err) return done.fail(err);
      client.keys("*" + test.template.id + "*", function (err, result) {
        if (err) return done.fail(err);
        expect(result).toEqual([]);
        done();
      });
    });
  });

  it("updates the cache ID of the blog which owns a template after dropping", function (done) {
    var test = this;
    var initialCacheID = test.blog.cacheID;
    drop(test.blog.id, test.template.name, function (err) {
      if (err) return done.fail(err);
      Blog.get({ id: test.template.owner }, function (err, blog) {
        if (err) return done.fail(err);
        expect(blog.cacheID).not.toEqual(initialCacheID);
        done();
      });
    });
  });

  // There is a bug with the drop function at the moment
  // It does a truthy check against an empty object in the
  // if (err || !allViews)  where all views is {}
  // Fix this in future and enable the spec.
  it("drop returns an error when the template does not exist", function (done) {
    var test = this;
    drop(test.blog.id, test.fake.random.word(), function (err) {
      expect(err instanceof Error).toBe(true);
      expect(err.code).toEqual("ENOENT");
      done();
    });
  });
});
