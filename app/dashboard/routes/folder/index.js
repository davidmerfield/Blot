var renderFile = require("./renderFile");
var renderFolder = require("./renderFolder");
var breadcrumbs = require("./breadcrumbs");
var determinePath = require("./determinePath");

module.exports = function(server) {
  server
    .route(["/", "/~*"])
    .get(determinePath)
    .get(breadcrumbs)
    .get(renderFolder)
    .get(renderFile);
};
