var fs = require("fs-extra");
var directory = __dirname + "/data";

if (require.main === module) list(process.exit);

function list(callback) {
  var states = fs.readdirSync(directory).filter(function(i) {
    return fs.statSync(directory + "/" + i).isDirectory();
  });

  console.log(states);
}
