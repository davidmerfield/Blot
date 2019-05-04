describe("brochure site", function() {
  var brochure = require("../../app/brochure");
  var blc = require("broken-link-checker");

  global.test.server(function(server) {
    server.use(brochure);
  });

  it(
    "does not have any broken links",
    function(done) {
      var broken = {};
      var origin = this.origin;
      var siteChecker = new blc.SiteChecker(
        {
          excludeExternalLinks: true
        },
        {
          link: function(result) {
            if (result.broken) {
              var base = result.base.resolved.slice(origin.length);

              broken[base] = broken[base] || [];
              broken[base].push(result.url.original);
            }
          },
          end: function() {
            expect(broken).toEqual({});
            done();
          }
        }
      );

      siteChecker.enqueue(origin);
    },
    60 * 1000
  );
});
