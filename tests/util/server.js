const Express = require("express");
const trace = require("helper/trace");

module.exports = function (router) {
    var server;
    var port = 8919;

    // verify that router is an express router
    // or an instance of express
    if (!router || !router.use) {
      throw new Error("router must be an express router");
    }

    // Create a webserver for testing remote files
    beforeAll(function (done) {
      server = Express();

      // This lets us pretend the test is running over HTTPS
      // otherwise we do not recieve the cookie set by
      // the dashboard when we POST to log in further down this page
      server.use((req, res, next) => {
        req.headers["X-Forwarded-Proto"] = "https";
        req.headers["x-forwarded-proto"] = "https";
        next();
      });

      server.use(trace.init);

      // trust proxy for secure cookies
      server.set("trust proxy", true);

      // remove x-powered-by header
      server.disable("x-powered-by");

      // turn off etags for responses
      server.set("etag", false);

      server.use(router);
      
      this.origin = "http://localhost:" + port;

      server = server.listen(port, function () {
        // I was getting unexpected results without
        // this arbritary delay. Basically, the dynamic
        // routes in my server were not working, but the
        // static folder was being served. This was serving
        // raw template files at endpoints, breaking my
        // broken link checking test. We would solve this
        // by only calling back to done once the server is
        // truly responding to requests properly...
        setTimeout(done, 1500);
      });
    });

    afterAll(function (done) {
      server.close(done);
      setTimeout(done, 1500);
    });
  }