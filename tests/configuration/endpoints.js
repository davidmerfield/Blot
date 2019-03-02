describe("configuration", function() {
  var request = require('request');

  it("returns OK at the health endpoint", function(done) {
    var server = require("../../app", {
      silent: true
    });

    request('http://localhost:8080/health', function(err, res, body){

      if (err) return done.fail(err);

      expect(res.statusCode).toBe(200);
      expect(body).toEqual('OK');
      done();
    });
  });
});
