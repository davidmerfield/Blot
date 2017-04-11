var helper = require('helper');
var Hash = helper.hash;

module.exports = function (blogID) {

  if (!blogID) throw 'Invalid blogID';

  if (blogID.indexOf('/') > -1) throw 'Invalid blogID';

  return Hash('blog:' + blogID).slice(0, 10);
};