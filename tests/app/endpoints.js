describe("Blot endpoints", function () {
  var request = require("request");
  var START_MESSAGE = "listening";
  var server;
  var stderr = '';

  beforeAll(function (done) {
    server = require("child_process").fork(__dirname + "/../../app", {
      silent: true,
    });

    // App should not emit anything on standard error
    server.stderr.on("data", function (data) {
      stderr += data.toString("utf8") + '\n';
    });

    // Listen for listening message
    server.stdout.on("data", function (data) {
      // This is a bit of a flimsy check to see if the server is running
      // there might be more than one message with listening in
      if (data.toString("utf8").indexOf(START_MESSAGE) > -1) {
        done();
      }
    });
  }, 50 * 1000);

  afterAll(function (done) {
    server.on("close", function () {
      expect(stderr).toEqual('');
      done();
    });

    server.kill();
  });

  // Stripe and Dropbox webhooks require HTTPS set up, or NGINX
  // working, so they are harder to test but it would be nice to
  // do this eventually.
  it("returns OK at the health endpoint", function (done) {
    request("http://localhost:8080/health", function (err, res, body) {
      if (err) return done.fail(err);
      expect(res.statusCode).toBe(200);
      expect(body).toEqual("OK");
      done();
    });
  });
});
