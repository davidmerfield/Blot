require('../only_locally');

var fs = require("fs-extra");
var directory = __dirname + "/data";
var moment = require("moment");
var colors = require("colors/safe");

if (require.main === module && !process.argv[2]) list(process.exit);
else require("./load")(process.argv[2], function(err){
  if (err) throw err;
  process.exit();
});

function list(callback) {
  fs.readdirSync(directory)
    .filter(function(i) {
      return i.indexOf('production-') === -1 && fs.statSync(directory + "/" + i).isDirectory();
    })
    .map(function(dir) {
      var message = " ";
      message += colors.yellow(dir);

      if (fs.existsSync(directory + "/" + dir + "/description.txt"))
        message +=
          " - " +
          fs.readFileSync(directory +  "/" + dir + "/description.txt", "utf-8");

      message +=
        " - " +
        colors.green(
          moment(fs.statSync(directory + "/" + dir).mtime).fromNow()
        );

      console.log(message);
    });
  callback();
}
