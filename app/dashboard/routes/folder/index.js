var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");

module.exports = function(server) {

  server.get("/view", function(req, res, next){
    req.session.path = req.query.path;
    next();
  });

  server
    .use(determinePath)
    .use(breadcrumbs)
    .use(renderFolder)
    .use(renderFile)
    .use(function (err, req, res, next){
      next();
    })
};
