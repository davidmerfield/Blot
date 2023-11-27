describe("Blot's website'", function () {
  var documentation = require("documentation");
  var dashboard = require("dashboard");
  var broken = require("../util/broken");
  var trace = require("helper/trace");

  global.test.blog();

  global.test.server(function (server, test) {
    server.use(trace.init);
    // This lets us pretend the test is running over HTTPS
    // otherwise we do not recieve the cookie set by
    // the dashboard when we POST to log in further down this page
    server.use("/dashboard", (req, res, next) => {
      req.headers["X-Forwarded-Proto"] = "https";
      req.headers["x-forwarded-proto"] = "https";
      next();
    });
    server.use("/dashboard", dashboard);

    // Send app/views/style.min.css and /app/views/documentation.min.js
    // NGINX should handle this but for testing we need node to do it
    server.get(
      [
        "/style.min.css",
        "/documentation.min.js",
        "/templates/data/:folder.zip"
      ],
      function (req, res) {
        res.send("OK");
      }
    );

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
  it(
    "does not have any broken links for logged-in users",
    function (done) {
      var request = require("request");
      var test = this;

      request.post(
        this.origin + "/dashboard/log-in",
        { form: { email: test.user.email, password: test.user.fakePassword } },
        function (err, res) {
          if (err) return done.fail(err);

          var cookie = res.headers["set-cookie"];
          var headers = { cookie: cookie };

          if (!cookie) {
            return done.fail("No cookie");
          }

          broken(
            test.origin + "/dashboard",
            { headers },
            function (err, results) {
              if (err) return done.fail(err);
              expect(results).toEqual({});
              done();
            }
          );
        }
      );
    },
    5 * 60 * 1000
  );
});
