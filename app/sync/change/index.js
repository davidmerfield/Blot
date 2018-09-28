var set = require("./set");
var drop = require("./drop");
var mkdir = require('./mkdir');
var rebuildDependents = require('./rebuildDependents');
var update = require('./update');

module.exports = function(blog) {
  return {
    set: set.bind(this, blog),
    drop: drop.bind(this, blog.id),
    mkdir: mkdir.bind(this, blog.id),
    update: update.bind(this, blog),
    rebuildDependents: rebuildDependents.bind(this, blog.id)
  };
};
