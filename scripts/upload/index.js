var helper = require("../../app/helper");
var config = require("../../config");
var upload = helper.upload;
var fs = require("fs");

var path = process.argv[2];

if (!fs.statSync(path).isFile()) throw new Error(path + " should be a file");

upload(path, { blogID: "SITE", bucket: config.cdn.bucket }, function(
  err,
  newUrl
) {
  if (err) throw err;

  console.log(newUrl);
});
