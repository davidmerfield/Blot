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

  exec('free -m', function(err, stdout){

    // lol
    var line = stdout.split('\n')[1].replace(/\s+/g,' ').split(' ');
    var usage = line[3];
    var available = line[2];

    cb(usage + 'mb', available + 'mb');
  });
}

module.exports = check;