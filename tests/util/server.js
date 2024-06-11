const Express = require("express");
const trace = require("helper/trace");
const puppeteer = require('puppeteer');


module.exports = function (router) {
  let server;
  const port = 8919;

  // Verify that router is an express router or an instance of express
  if (!router || !router.use) {
    throw new Error("router must be an express router");
  }
  
  // for each spec, create a new page
  // and close it after the spec is done
  beforeEach(async function () {
    this.page = await this.browser.newPage();
  });

  afterEach(async function () {
    await this.page.close();
  });

  // Create a webserver for testing remote files
  beforeAll(async function (done) {

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    // Expose the server origin for the tests
    // specs so they can use this.origin 
    this.origin = `http://localhost:${port}`;

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

    this.browser.close();
    
    if (server) {
      server.close(() => {});
    } 
    done();
  });
};