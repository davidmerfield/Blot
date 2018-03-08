var fs = require('fs-extra');
var config = require('config');

flush();

function flush () {

  fs.emptyDir(config.cache_directory, function(err){
    
    if (err) throw err;

    console.log('... CACHE CLEARED');
  });

}

var readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  } else {
    flush();
  }
});
