describe("configuration", function() {
  // The test to start the main server
  // and resolve unused dependencies both
  // needs a little longer to run. 20s should be plenty
  var LONG_TIMEOUT = 20 * 1000;

  require('child_process').exec('git --version', function(err, result){
    console.log('Git version:', result);
  });

  // TODO: check that g
  it("loads without error", function() {
    expect(function() {
      require("../../config");
    }).not.toThrow();
  });

  it("has no unused depdendencies", function(done) {
    require('./dependencies')(function(err, unused){
      expect(err).toBe(null);
      expect(unused).toEqual([]);
      done();
    });
  }, LONG_TIMEOUT);

  it("connects to redis", function(done) {
    require("../../app/models/client").get("hey", function(err) {
      expect(err).toBe(null);
      done();
    });
  });

  fit(
    "loads the main function",
    function(done) {
      var demo_app = require("child_process").fork(__dirname + "/../../app", {
        silent: true
      });

      var has_err = false;

      demo_app.on("close", function(code) {
        expect(code).toEqual(143);
        expect(has_err).toEqual(false);
        done();
      });

      // App should not emit anything on standard error
      demo_app.stderr.on("data", function(data) {
        has_err = true;
        demo_app.kill();
      });

      // Listen for listening message
      demo_app.stdout.on("data", function(data) {
        // The server managed to start, we can end the test...
        if (data.toString().indexOf("listening") > -1) {
          demo_app.kill();
        }
      });
    },
    LONG_TIMEOUT
  );
});
