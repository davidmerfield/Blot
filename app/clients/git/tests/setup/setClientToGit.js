var url = require('url');

module.exports = function setClientToGit(blog, port, callback) {
  var repoUrl;

  require("../../create")(blog, function(err) {
    if (err) return callback(err);

    require("../../database").getToken(blog.id, function(err, token) {
      if (err) return callback(err);

      repoUrl = url.format({
        auth: blog.handle + ":" + token,
        protocol: "http",
        hostname: "localhost",
        port: port,
        pathname: "/clients/git/end/" + blog.handle + ".git"
      });

      callback(null, repoUrl);
    });
  });
};