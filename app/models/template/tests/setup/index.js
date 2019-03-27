var create = require("../../index").create;
var getTemplateList = require("../../index").getTemplateList;

module.exports = function setup(options) {
  options = options || {};

  // Create test blog before each test and remove it after
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
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
};
