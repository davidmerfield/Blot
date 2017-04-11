console.log('Emptying test file directory');

require('rimraf')(__dirname + '/files/*', function (err) {

  if (err) throw err;

  console.log('Done!');

  process.exit();
});
