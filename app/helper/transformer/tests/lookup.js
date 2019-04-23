describe("transformer", function() {
  var fs = require("fs-extra");

  // Creates test environment
  require("./setup")({});

  it("transforms a file", function(done) {
    this.transformer.lookup(this.path, this.transform, function(err, result) {
      if (err) return done.fail(err);

      expect(result).toEqual(jasmine.any(Object));
      expect(result.size).toEqual(jasmine.any(Number));
      done();
    });
  });

  it("transforms a remote file", function(done) {
    this.transformer.lookup(this.url, this.transform, function(err, result) {
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

  it("re-transforms the file if its contents changes", function(done) {
    var test = this;
    var spy = jasmine.createSpy().and.callFake(test.transform);
    var path = test.blogDirectory + "/" + test.path;

    test.transformer.lookup(test.path, test.transform, function(
      err,
      firstResult
    ) {
      if (err) return done.fail(err);

      // Modify the file
      fs.outputFileSync(path, Date.now().toString());

      test.transformer.lookup(test.path, spy, function(err, secondResult) {
        if (err) return done.fail(err);

        expect(spy).toHaveBeenCalled();
        expect(firstResult).not.toEqual(secondResult);

        done();
      });
    });
  });
});
