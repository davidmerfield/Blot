describe("twitter plugin", function () {
  xit("works", function () {
    expect(function () {
      var plugins = require("../index.js").convert,
        assert = require("assert");

      var goodURLs = [
        "https://twitter.com/davidmerfieId/status/500323409218117633",
        "http://twitter.com/davidmerfieId/status/500323409218117633",
        "https://twitter.com/davidmerfieId/status/500323409218117633/",
        "https://twitter.com/davidmerfieId/status/500323409218117633?foo=bar",
        "https://twitter.com/davidmerfieId/STATUS/500323409218117633?foo=bar",
      ];

      var badURLs = [
        "http://twatter.com/davidmerfieId/status/500323409218117633",
        "http://twitter.foo.com/davidmerfieId/status/500323409218117633",
        "https://twitter.com/davidmerfieId/500323409218117633",
        "https://twitter.com/davidmerfieId/status",
        "https://twitter.com/davidmerfieId/ST/500323409218117633",
        "",
        "ABC",
      ];

      for (var i in goodURLs) goodURLs[i] = linkify(goodURLs[i]);
      for (var j in badURLs) badURLs[j] = linkify(badURLs[j]);

      goodURLs.forEach(function (html) {
        plugins(
          { plugins: { twitter: { enabled: true } } },
          "/path.txt",
          html,
          function (err, newHTML) {
            assert(newHTML !== html);
          }
        );
      });

      badURLs.forEach(function (html) {
        plugins(
          { plugins: { twitter: { enabled: true } } },
          "/path.txt",
          html,
          function (err, newHTML) {
            assert(newHTML === html);
          }
        );
      });

      console.log("All tests complete?");

      function linkify(url) {
        return '<p><a href="' + url + '">' + url + "</a></p>";
      }
    }).not.toThrow();
  });
});
