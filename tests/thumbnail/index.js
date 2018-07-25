describe("thumbnail", function() {
  it("creates thumbnails", function(done) {
    require("../../app/thumbnail/transform")(
      __dirname + "/peach.jpg",
      __dirname + "/data",
      function(err, result) {
        expect(err).toBe(null);
        expect(result).toEqual(jasmine.any(Object));

        done();
      }
    );
  });
});
