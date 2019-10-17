var makeRequest = require("request");
var url = require("url");

module.exports = function(server) {
  // Called on the site to call the individual
  // blog. We could make this call directly but
  // to do so would violate our CSP. This is posssibly safer
  server.get("/verify-domain/:domain", function(request, response) {
    var domain = request.params.domain;
    domain = domain.replace(" ", "");

    if (domain.indexOf("//") > -1) domain = url.parse(domain).hostname;

    var options = {
      // Change this to https is the
      // user requries SSL to visit blog
      uri: "http://" + domain + "/verify/domain-setup",

      // The request module has a known bug
      // which leaks memory and event emitters
      // during redirects. We cap the maximum
      // redirects to 5 to avoid encountering
      // errors when it creates 10+ emitters
      // for a URL with 10+ redirects...
      maxRedirects: 5
    };

    makeRequest(options, function(error, res, body) {
      response.send(body === request.blog.handle);
    });
  });
};
