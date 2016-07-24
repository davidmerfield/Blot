var client = require('./models/client');
var helper = require('./helper');
var ensure = helper.ensure;

var todayKey = 'analytics:today';
var allKey = 'analytics:all';

function middleware (req, res, next) {

  next();

  return client.incr(todayKey, function (err) {

    if (err) console.log(err);

  });
}

function rotate (callback) {

  ensure(callback, 'function');

  client.get(todayKey, function (err, views) {

    if (err) throw err;

    client.lpush(allKey, views, function(err){

      if (err) throw err;

      // this will effectively reset it to zero
      client.del(todayKey, function (err) {

        if (err) throw err;

        if (callback) callback();
      });
    });
  });
}

function today (callback) {

  ensure(callback, 'function');

  client.get(todayKey, callback);
}

function yesterday (callback) {

  ensure(callback,'function');
  client.LRANGE(allKey, 0, 0, callback);
}

module.exports = {
  middleware: middleware,
  rotate: rotate,
  today: today,
  yesterday: yesterday
};