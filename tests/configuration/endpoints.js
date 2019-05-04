describe("Blot", function() {
  var request = require("request");

  // Run Blot's application servers
  require("../util/startApp")();

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
