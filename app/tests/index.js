describe("Blot configuration", function () {
  // The test to start the main server
  // and resolve unused dependencies both
  // needs a little longer to run. 50s should be plenty
  var LONG_TIMEOUT = 50 * 1000;

  // TODO: check that g
  it("config loads without error", function () {
    expect(function () {
      require("../../config");
    }).not.toThrow();
  });

  var fetch = require("node-fetch");
  var START_MESSAGE = "listening";
  var server;
  var stderr = "";

  beforeAll(function (done) {
    server = require("child_process").fork(__dirname + "/../../app", {
      silent: true
    });

    // App should not emit anything on standard error
    server.stderr.on("data", function (data) {
      stderr += data.toString("utf8") + "\n";
    });

    // Listen for listening message
    server.stdout.on("data", function (data) {
      // This is a bit of a flimsy check to see if the server is running
      // there might be more than one message with listening in
      if (data.toString("utf8").indexOf(START_MESSAGE) > -1) {
        done();
      }
    });
  }, LONG_TIMEOUT);

  afterAll(function (done) {
    server.on("exit", function () {
      done();
    });

    server.kill();
  });

  // Stripe and Dropbox webhooks require HTTPS set up, or NGINX
  // working, so they are harder to test but it would be nice to
  // do this eventually.
  it("returns OK at the health endpoint", function (done) {
    fetch("http://127.0.0.1:3000/health")
      .then(function (res) {
        expect(res.statusCode).toBe(200);
        return res.text();
      })
      .then(function (body) {
        expect(body).toEqual("OK");
        done();
      });
  });

  it("can connect to redis", function (done) {
    require("models/client").ping(function (err) {
      expect(err).toBe(null);
      done();
    });
  });
});
