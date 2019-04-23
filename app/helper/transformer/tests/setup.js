module.exports = function setup(options) {
  var Transformer = require("../index");
  var fs = require("fs-extra");

  // Create temporary blog before each test, clean up after
  global.test.blog();

  // Sets up a temporary tmp folder, cleans it up after
  global.test.tmp();

  beforeEach(function() {
    // This simulates me using the transformer to perform
    // some task that I don't want to repeat needlessly.
    // In reality, it might be the function which turns
    // an image into thumbnails, or the function which
    this.transform = function(path, done) {
      fs.stat(path, function(err, stat) {
        if (err) return done(err);

        done(null, { size: stat.size });
      });
    };

    // This represents the cache of previous transformations
    // stored for a given blog. "transformer" is just a label
    this.transformer = new Transformer(this.blog.id, "transformer");

    // Create a test file to use for the transformer
    this.path = "foo.txt";
    fs.outputFileSync(this.blogDirectory + "/" + this.path, "Hello, World!");
  });
};
