module.exports = function startServer(done) {
  var Express = require("express");
  var app = Express();
  var routes = require("../../routes").site;

  app.use("/clients/git", routes);
  this.app = app.listen(8284, done);
};
