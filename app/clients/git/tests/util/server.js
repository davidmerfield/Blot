var Express = require("express");

module.exports = {
  start: function(done) {
    var port = 1000 + Math.round(Math.random() * 10000);
    this.server = Express()
      .use("/clients/git", require("../../routes").site)
      .listen(port, done);
    this.server.port = port;
  },
  close: function(done) {
    this.server.close(done);
  }
};
