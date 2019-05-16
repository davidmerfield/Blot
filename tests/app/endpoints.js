describe("Blot endpoints", function() {
  var request = require("request");
  var START_MESSAGE = "Blot is listening on port";
  var server;
  var has_err = false;

  beforeAll(function(done) {
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
      if (data.toString("utf8").indexOf(START_MESSAGE) > -1) {
        done();
      }
    });
  }, 50 * 1000);

  afterAll(function(done) {
    server.on("close", function(code) {
      // 128 + 15
      // https://github.com/sindresorhus/exit-hook/commit/b6c274f6dc7617b8c800d612ac343ecc0cdef867
      expect(code).toEqual(143);
      expect(has_err).toEqual(false);
      done();
    });

    server.kill();
  });

  // Stripe and Dropbox webhooks require HTTPS set up, or NGINX
  // working, so they are harder to test but it would be nice to
  // do this eventually.

  it("returns OK at the health endpoint", function(done) {
    request("http://localhost:8080/health", function(err, res, body) {
      if (err) return done.fail(err);
      expect(res.statusCode).toBe(200);
      expect(body).toEqual("OK");
      done();
    });
  });
});
