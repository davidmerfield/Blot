describe("Blot's codebase", function () {
  // The test to start the main server
  // and resolve unused dependencies both
  // needs a little longer to run. 20s should be plenty
  var LONG_TIMEOUT = 20 * 1000;

  xit(
    "has no unused dependencies",
    function (done) {
      require("./dependencies")(function (err, unused) {
        expect(err).toBe(null);
        expect(unused).toEqual([]);
        done();
      });
    },
    LONG_TIMEOUT
  );
});
