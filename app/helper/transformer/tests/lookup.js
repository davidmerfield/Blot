describe("transformer", function() {
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
});
