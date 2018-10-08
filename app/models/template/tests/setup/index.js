module.exports = function setup(options) {
  options = options || {};

  // Create test blog before each test and remove it after
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });
};
