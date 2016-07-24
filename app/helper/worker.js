var childprocess = require('child_process');
var fork = childprocess.fork;

module.exports = function (path, options) {

  options = options || {};

  // By default, scripts are kept alive.
  // Sometimes, we might want to run a script
  // once, so you can pass forever: false
  if (options.forever === undefined)
    options.forever = true;

  var worker = launch();

  function launch () {

    var new_worker = fork(path);

    // Restart this script in event
    // it encounters exception
    // should also email me here...
    if (options.forever) {

      new_worker.on('exit', function(err){

        if (err) {
          console.log(path, 'process exited with code', err);
          if (err.stack) console.log(err.stack);
        }

        worker = launch();
      });
    }

    return new_worker;
  }

  process.on('exit', function(){
    worker.kill();
  });

  // would be nice to have a way
  // to properly call back
  return function (message, callback){
    worker.send(message);
    if (callback) callback();
  };
};