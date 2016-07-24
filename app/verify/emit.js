var redis = require('redis').createClient();

module.exports = function (blogID) {

  return function emit (message) {

    if (message.slice(0, 1) !== '✓')
      console.log('Blog:', blogID, 'Verify:', message);

    redis.publish('verify:status:' + blogID, message.toString());
  };
};