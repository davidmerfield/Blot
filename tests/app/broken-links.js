describe("Blot broken links", function() {
  var brochure = require("../../app/brochure");
  var dashboard = require("../../app/dashboard");
  var broken = require("../util/broken");

  global.test.blog();

  global.test.server(function(server) {
    server.use(dashboard);
    server.use(brochure);
  });

  it(
    "does not have any broken links for logged-out users",
    function(done) {
      broken(this.origin, function(err, results) {
        if (err) return done.fail(err);
        expect(results).toEqual({});
        done();
      });
    },
    5 * 60 * 1000
  );

  it(
    "does not have any broken links for logged-in users",
    function(done) {
      var request = require("request");
      var test = this;

      request.post(
        this.origin + "/log-in",
        { form: { email: test.user.email, password: test.user.fakePassword } },
        function(err, res) {
          if (err) return done.fail(err);

          var cookie = res.headers["set-cookie"];
          var headers = { cookie: cookie };

          if (!cookie) {
            return done.fail("No cookie");
          }

          broken(test.origin, { headers: headers }, function(err, results) {
            if (err) return done.fail(err);
            expect(results).toEqual({});
            done();
          });
        }
      );
    },
    5 * 60 * 1000
  );
});
