var fs = require("fs-extra");
var directory = __dirname + "/data";
var moment = require('moment');
var colors = require('colors/safe');

if (require.main === module) list(process.exit);

function list(callback) {

  console.log('Save: node scripts/state/save\n');
  var states = fs.readdirSync(directory).filter(function(i) {
    return fs.statSync(directory + "/" + i).isDirectory();
  }).map(function(dir){
    console.log(colors.yellow(dir), colors.green(moment(fs.statSync(directory + '/' + dir).mtime).fromNow()));
    console.log('node scripts/state', dir, '\n');
  });

}
