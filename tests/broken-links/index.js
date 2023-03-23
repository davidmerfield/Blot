describe("Blot's website'", function () {
  var documentation = require("documentation");
  var dashboard = require("dashboard");
  var broken = require("../util/broken");
  var trace = require("helper/trace");

  global.test.blog();

  global.test.server(function (server, test) {
    server.use(trace.init);
    server.use("/dashboard", dashboard);
    server.use(documentation);
  });

  it(
    "does not have any broken links for logged-out users",
    function (done) {
      broken(this.origin, function (err, results) {
        if (err) return done.fail(err);
        expect(results).toEqual({});
        done();
      });
    },
    5 * 60 * 1000
  );

  // todo enable when we can access the cookie over an insecure connection
  xit(
    "does not have any broken links for logged-in users",
    function (done) {
      var request = require("request");
      var test = this;

      console.log("origin:", this.origin);

      // request.post(
      //   this.origin + "/log-in",
      //   { form: { email: test.user.email, password: test.user.fakePassword } },
      //   function (err, res) {
      //     if (err) return done.fail(err);

      //     var cookie = res.headers["set-cookie"];
      //     var headers = { cookie: cookie };

      //     if (!cookie) {
      //       return done.fail("No cookie");
      //     }

      broken(test.origin + "/dashboard", function (err, results) {
        if (err) return done.fail(err);
        expect(results).toEqual({});
        done();
      });
      //   }
      // );
    },
    5 * 60 * 1000
  );
});
