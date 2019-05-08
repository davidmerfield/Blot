module.exports = function() {
  var server;
  var has_err = false;

  beforeAll(function(done) {
    // process.env.BLOT_HOST = 'localhost';

    server = require("child_process").fork(__dirname + "/../../app", {
      silent: true
    });

    // App should not emit anything on standard error
    server.stderr.on("data", function(data) {
      has_err = true;
      console.log("CONFIGURATION error:", data.toString("utf8"));
      server.kill();
      done(new Error("Server failed to start: " + data.toString("utf8")));
    });

    // Listen for listening message
    server.stdout.on("data", function(data) {
      // This is a bit of a flimsy check to see if the server is running
      if (data.toString("utf8").indexOf("started") > -1) {
        done();
      }
    });
  });

  afterAll(function(done) {
    done();

    server.on("close", function(code) {
      // 128 + 15
      // https://github.com/sindresorhus/exit-hook/commit/b6c274f6dc7617b8c800d612ac343ecc0cdef867
      expect(code).toEqual(143);
      expect(has_err).toEqual(false);
    });

    server.kill();
  });
};
