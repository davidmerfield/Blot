const Express = require("express");
const trace = require("helper/trace");

module.exports = function (router) {
  let server;
  const port = 8919;

  // Verify that router is an express router or an instance of express
  if (!router || !router.use) {
    throw new Error("router must be an express router");
  }

  // Create a webserver for testing remote files
  beforeAll(function (done) {
    const app = Express();

    // This lets us pretend the test is running over HTTPS
    app.use((req, res, next) => {
      req.headers["X-Forwarded-Proto"] = req.headers["X-Forwarded-Proto"] || "https";
      req.headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "https";
      next();
    });

    app.use(trace.init);

    // Trust proxy for secure cookies
    app.set("trust proxy", true);

    // Remove x-powered-by header
    app.disable("x-powered-by");

    // Turn off etags for responses
    app.set("etag", false);

    app.use(router);

    this.origin = `http://localhost:${port}`;

    // Start the server
    server = app.listen(port, () => {
      console.log(`Test server listening at ${this.origin}`);
      done();
    });

    server.on('error', (err) => {
      console.error("Error starting test server:", err);
      done.fail(err);
    });
  });

  afterAll(function (done) {
    if (server) {
      server.close((err) => {
        if (err) {
          console.error("Error stopping test server:", err);
          done.fail(err);
        } else {
          console.log("Test server stopped");
          done();
        }
      });
    } else {
      done();
    }
  });
};