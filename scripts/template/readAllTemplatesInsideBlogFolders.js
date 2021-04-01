var readFromFolder = require("modules/template").update;
var eachBlog = require("../each/blog");

if (require.main === module) {
  main(function (err) {
    if (err) throw err;

    console.log("Re-read all templates inside blog folders!");
    process.exit();
  });
}

function main(callback) {
  eachBlog(function (user, blog, next) {
    readFromFolder(blog.id, function (err) {
      next();
    });
  }, callback);
}

module.exports = main;
