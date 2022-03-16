var colors = require("colors/safe");
var main = require("sync/fix/all");

console.log("Fixing all blogs...");
main(function (err, report) {
  if (err) {
    console.error(colors.red("Error:", err.message));
    return process.exit(1);
  }

  console.log("Fixed all blogs, report:");
  console.log(JSON.stringify(report));
  process.exit();
});
