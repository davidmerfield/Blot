var files = __dirname + '/files';
var write = require('fs').writeFileSync;

var i = 1;
var MAX = parseInt(process.argv[2]) || 10;

console.log('Building', MAX, 'test files to upload from', files);

while (i <= MAX) {
  write(files + '/' + i + '.txt', i, 'utf-8');
  i++;
}