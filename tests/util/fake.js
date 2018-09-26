// Docs
// https://rawgit.com/Marak/faker.js/master/examples/browser/index.html

var fake = require('faker');
var join = require('path').join;

// Ensure we can reproduce fake data
fake.seed(Math.floor(Math.random() * 1000));

fake.path = function path (ext) {

  var res = [];
  var len = 1 + Math.floor(Math.random() * 10);

  while (res.length < len) {
    res.push(fake.random.word());
  }
  
  if (ext) res[res.length -1] += ext;

  // would be nice to remove this
  return '/' + join.apply(this, res);
};

fake.file = function (options) {

  options = options || {};

  var res = '';

  if (options.title) res += '# ' + options.title + '\n\n';
  
  res += fake.lorem.paragraphs();

  return res;
};

module.exports = fake;

