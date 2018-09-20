var lock = require('../index');
var assert = require('assert');
var debug = require('debug');
var prefix = 'lock:tests';
var BLOG_ID = '123';
var for_each = require('helper').forEach;

var tests = [
  'basic',
  'wait',
  'wait_concurrent',
  'retry',
  'retry_negative',
  'retry_multiple'
];

tests = tests.map(function(name){

  debug(prefix)('Loading test', name);

  return require('./' + name).bind(
    this,
    lock,
    debug(prefix + ':' + name),
    assert,
    BLOG_ID
  );

});

for_each(tests, function(test, next){
  
  test(function(err){

    if (err) throw err;

    next();
  });

}, function(){

  debug('All tests complete!');
  process.exit();

});
