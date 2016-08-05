var exec = require('child_process').exec;
var config = require('config');

if (require.main === module) {
  check(function(usage, available){
    console.log('Usage:', usage);
    console.log('Available:', available);
    process.exit();
  });
}

function check (cb) {

  if (config.environment !== 'production') return cb();

  exec('df -h', function(err, stdout){

    // lol
    var disk = stdout.split('\n')[1].replace(/\s+/g,' ').split(' ');
    var usage = disk[4];
    var available = disk[3];

    cb(usage, available);
  });
}

module.exports = check;