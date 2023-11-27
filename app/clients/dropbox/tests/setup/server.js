var Express = require("express");

module.exports = {
  start: function attempt(done) {
    var port = 10000 + Math.round(Math.random() * 10000);
    var mount = "/clients/dropbox";
    this.server = Express()
      .use(mount, require("../../index").site_routes)
      .listen(port, function (err) {
        if (err && err.code === "EADDRINUSE") return attempt(done);
        if (err && err.code === "EACCESS") return attempt(done);
        if (err) return done(err);
        done();
      });
    this.server.port = port;
    this.server.baseUrl = "http://localhost:" + port + mount;
  },
  close: function (done) {
    this.server.close(done);
  },
};
