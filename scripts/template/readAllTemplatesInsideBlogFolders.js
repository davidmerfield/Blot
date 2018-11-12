var readFromFolder = require("../../app/modules/template").update;
var _ = require("lodash");
var eachBlog = require("../each/blog");
var Template = require("../../app/models/template");
var helper = require("helper");
var async = require("async");
var shouldWrite = {};

if (require.main === module) {
  main(function(err) {
    if (err) throw err;

    console.log("Re-read all templates inside blog folders!");
    process.exit();
  });
}

function main(callback) {
  eachBlog(
    function(user, blog, next) {
      readFromFolder(blog.id, function(err){
        next();
      });
    },
    callback
  );
}

module.exports = main;
