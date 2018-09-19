var mkdir = require('./mkdir');
var add = require('./add');
var remove = require('./remove');
var update = require('./update');

module.exports = function (blog) {
  return {
    mkdir: new mkdir(blog),
    add: new add(blog),
    remove: new remove(blog),
    update: new update(blog)
  };
};