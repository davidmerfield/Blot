var create = require("../../index").create;
var getTemplateList = require("../../index").getTemplateList;
var localClient = require("clients").local;
var setView = require("../../index").setView;
var helper = require("helper");
var Blog = require("blog");

module.exports = function setup(options) {
  options = options || {};

  // Create test blog before each test and remove it after
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });

  // Set up local client so we can write templates locally
  beforeEach(function(done) {
    var blogID = this.blog.id;
    var clientDir = helper.tempDir() + helper.guid();

    this.clientDir = clientDir;

    Blog.set(blogID, { client: "local" }, function(err) {
      if (err) return done.fail(err);
      localClient.setup(blogID, clientDir, done);
    });
  });

  // Create a test template
  if (options.createTemplate) {
    beforeEach(function(done) {
      var test = this;
      var name = test.fake.random.word();
      create(test.blog.id, name, {}, function(err) {
        if (err) return done(err);
        getTemplateList(test.blog.id, function(err, templates) {
          test.template = templates.filter(function(template) {
            return template.name === name;
          })[0];
          done();
        });
      });
    });
  }

  // Create a test view
  if (options.createView) {
    beforeEach(function(done) {
      var test = this;
      var view = {
        name: test.fake.random.word(),
        url: "/" + test.fake.random.word(),
        content: test.fake.random.word()
      };
      setView(test.template.id, view, function(err) {
        if (err) return done(err);
        test.view = view;
        done();
      });
    });
  }
};
