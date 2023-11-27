var colors = require("colors/safe");
var get = require("../../get/blog");
var main = require("sync/fix");

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  main(blog, function (err, report) {
    if (err) {
      console.error(colors.red("Error:", err.message));
      return process.exit(1);
    }

    console.log("Fixed blog, report:");
    console.log(JSON.stringify(report));
    process.exit();
  });
});
