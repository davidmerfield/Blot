var redis = require('redis').createClient();

console.log(process.argv.slice(2));

redis.keys('blog:*:url:*', function (err, keys) {
  console.log(keys.length);
  process.exit();
});