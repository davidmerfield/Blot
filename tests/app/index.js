describe("Blot configuration", function() {
  // The test to start the main server
  // and resolve unused dependencies both
  // needs a little longer to run. 20s should be plenty
  var LONG_TIMEOUT = 20 * 1000;

  // TODO: check that g
  it("config loads without error", function() {
    expect(function() {
      require("../../config");
    }).not.toThrow();
  });

  it(
    "uses all of its installed depdendencies",
    function(done) {
      require("./dependencies")(function(err, unused) {
        expect(err).toBe(null);
        expect(unused).toEqual([]);
        done();
      });
    },
    LONG_TIMEOUT
  );

  it("can connect to redis", function(done) {
    require("../../app/models/client").ping(function(err) {
      expect(err).toBe(null);
      done();
    });
  });
});
