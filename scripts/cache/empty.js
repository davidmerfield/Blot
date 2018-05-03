var fs = require('fs-extra');
var config = require('config');
var helper = require('../../app/helper');
var forEach = helper.forEach;

if (require.main === module) {
  
  flush(function(){
    console.log('... CACHE CLEARED');
  });

  var readline = require('readline');
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      process.exit();
    } else {
      flush(function(){
        console.log('... CACHE CLEARED');
      });
    }
  });

}

function flush (cb) {

  fs.readdir(config.cache_directory, function(err, items){
    
    if (err) throw err;

    forEach.parallel(items, function(item, next){

      // Ignore dotfiles and .tmp directory
      if (item[0] === '.') return next();

      fs.remove(item, next);
    }, cb);
  });
}

module.exports = flush;