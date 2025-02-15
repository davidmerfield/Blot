const Express = require("express");
const trace = require("helper/trace");
const config = require("config");

module.exports = function (router) {
  let server;
  const port = 8919;

  // Verify that router is an express router or an instance of express
  if (!router || !router.use) {
    throw new Error("router must be an express router");
  }
  
  // Create a webserver for testing remote files
  beforeAll(async function (done) {

    // Expose the server origin for the tests
    // specs so they can use this.origin 
    this.origin = `http://localhost:${port}`;

    // Special function which allows us to make requests
    // to fake domains in the tests over a fake protocol
    this.fetch = (input, options = {}) => {

      // parse the input so:
      // if it's a full URL:
      // - we remap the host if it's anything other than localhost
      // - we remap the protocol from https to http
      // if it's a path:
      // - we prepend the origin
      const url = new URL(input, this.origin);

      if (url.hostname !== "localhost") {
        options.headers = options.headers || {};
        options.headers["x-forwarded-host"] = url.hostname;
        url.hostname = "localhost";
      }

      url.protocol = "http:";
      url.port = port;

      const modifiedURL = url.toString();

      return fetch(modifiedURL, options);
    }

    const app = Express();

    app.use((req, res, next) => {
      // This lets us pretend the test is running on a different domain
      req.headers["host"] = req.headers["x-forwarded-host"];

      // This lets us pretend the test is running over HTTPS
      req.headers["X-Forwarded-Proto"] = req.headers["X-Forwarded-Proto"] || "https";
      req.headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "https";
      next();
    });

    app.use(trace.init);

    app.use(require('request-logger'));

    // Trust proxy for secure cookies
    app.set("trust proxy", true);

    // Remove x-powered-by header
    app.disable("x-powered-by");

    // Turn off etags for responses
    app.set("etag", false);

    app.use(router);

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

  afterAll(function () {
    server.close();
  });
};