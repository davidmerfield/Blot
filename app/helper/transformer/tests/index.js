var Transformer = require("../index");
var fs = require("fs-extra");
// var localPath = require("../../localPath");

describe("transformer", function() {
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

  it("transforms a file", function(done) {
    this.transformer.lookup(this.path, this.transform, function(err, result) {
      if (err) return done.fail(err);

      expect(result).toEqual(jasmine.any(Object));
      expect(result.size).toEqual(jasmine.any(Number));
      done();
    });
  });

  it("transforms the same file once", function(done) {
    var test = this;
    var firstTransform = jasmine.createSpy().and.callFake(test.transform);
    var secondTransform = jasmine.createSpy().and.callFake(test.transform);

    test.transformer.lookup(test.path, firstTransform, function(
      err,
      firstResult
    ) {
      if (err) return done.fail(err);

      test.transformer.lookup(test.path, secondTransform, function(
        err,
        secondResult
      ) {
        if (err) return done.fail(err);

        expect(firstTransform).toHaveBeenCalled();
        expect(secondTransform).not.toHaveBeenCalled();
        expect(firstResult).toEqual(secondResult);

        done();
      });
    });
  });
});
