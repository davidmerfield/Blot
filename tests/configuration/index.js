describe("configuration", function() {
  // The test to start the main server
  // and resolve unused dependencies both
  // needs a little longer to run. 20s should be plenty
  var LONG_TIMEOUT = 20 * 1000;

  require("child_process").exec("git --version", function(err, result) {
    console.log("Git version:", result);
  });

  // TODO: check that g
  it("loads without error", function() {
    expect(function() {
      require("../../config");
    }).not.toThrow();
  });

  it(
    "has no unused depdendencies",
    function(done) {
      require("./dependencies")(function(err, unused) {
        expect(err).toBe(null);
        expect(unused).toEqual([]);
        done();
      });
    },
    LONG_TIMEOUT
  );

  it("connects to redis", function(done) {
    require("../../app/models/client").get("hey", function(err) {
      expect(err).toBe(null);
      done();
    });
  });
});
