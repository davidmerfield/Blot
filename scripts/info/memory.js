var exec = require('child_process').exec;

if (require.main === module) {
  check(function(usage, available){
    console.log('Usage:', usage);
    console.log('Available:', available);
    process.exit();
  });
}

function check (cb) {

  exec('free -m', function(err, stdout){

    // lol
    var line = stdout.split('\n')[1].replace(/\s+/g,' ').split(' ');
    var usage = line[2];
    var available = disk[3];

    cb(usage, available);
  });
}