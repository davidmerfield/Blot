var start = require('./start');

// determine users who still have leases / again set
// for each, sync then verify... but do this in a safe
// seperate process.
require('./check');

process.on('message', function(uid) {

  start(uid, function(err){

    if (err) {
      console.log(err);
      if (err.stack) console.log(err.stack);
      if (err.trace) console.log(err.trace);
    }
  });
});

console.log('Listening for sync messages...');