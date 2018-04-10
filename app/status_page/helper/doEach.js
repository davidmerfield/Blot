var forEach = require('./forEach').parallel;
var ensure = require('./ensure');

function doEach (queue, callback) {

  ensure(queue, ['function'])
    .and(callback, 'function');

  forEach(queue, function(method, next){
    method(next);
  }, callback);

};

function foo (cb) {
  console.log('FOO INVOKED');
  cb();
}

function bar (cb) {
  console.log('BAR INVOKED');
  cb();
}

function baz (cb) {
  console.log('BAZ INVOKED');
  cb();
}

// doEach([foo, bar, baz], function(){
//   console.log('EVERYTHING DONE!');
// });

module.exports = doEach;