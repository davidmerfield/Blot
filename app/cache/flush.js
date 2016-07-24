var clear = require('./clear');

if (require.main === module) {
  main(process.exit);
}

function main (cb) {
  clear('*', cb);
  console.log('Flushed the cache!');
}

module.exports = main;