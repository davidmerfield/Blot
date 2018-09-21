var disconnect = require('../../disconnect');
module.exports = function (done) {

  disconnect(global.blog.id, done);
};