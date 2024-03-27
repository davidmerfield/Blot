const fetch = require("node-fetch");
const url = require("url");

module.exports = function (request, response) {
  let domain = request.params.domain;
  domain = domain.replace(/\s/g, ""); // Remove all spaces

  if (domain.indexOf("//") > -1) domain = new URL(domain).hostname;

  // Use HTTPS to ensure secure communication
  const endpoint = `https://${domain}/verify/domain-setup`;

  fetch(endpoint)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.text();
    })
    .then(body => {
      // Send back a boolean response whether the body matches `request.blog.handle`
      response.send(body === request.blog.handle);
    })
    .catch(error => {
      // Handle any errors that occurred during fetch
      console.error("Fetch error:", error);
      response
        .status(500)
        .send("An error occurred while verifying the domain setup");
    });
};
