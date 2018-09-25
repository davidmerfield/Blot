var disconnect = require('../../disconnect');
module.exports = function (done) {

  disconnect(this.blog.id, done);
};