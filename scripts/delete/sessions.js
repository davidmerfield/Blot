var redis = require('redis').createClient();

countKeys('*');
countKeys('sess:*');

redis.keys('sess:*', function (error, sessionKeys) {

  sessionKeys.forEach(function(sessionKey) {

    console.log('Deleting: ' + sessionKey);

    redis.del(sessionKey);
  });

  countKeys('*');
  countKeys('sess:*');
});

function count (key) {
  redis.keys(key, function (error, keys) {
    console.log(key + ' keys number: ' + keys.length);
  });
}

function countKeys () {
  count('*');
  console.log('-------');
}