describe("brochure site", function() {
  var brochure = require("../../app/brochure");
  var broken = require("./broken");

  global.test.server(function(server) {
    server.use(brochure);
  });

  it(
    "does not have any broken links",
    function(done) {
      broken(this.origin, function(err, results) {
        if (err) return done.fail(err);
        expect(results).toEqual([]);
        done();
      });
    },
    60 * 1000
  );
});
