var colors = require("colors/safe");
var client = require('redis').createClient();
var multi = client.multi();
var keysToDelete = [];
var yesno = require('yesno');
redisKeys('*', function(keys, next) {
  keysToDelete = keysToDelete.concat(keys.filter(function(key) {
    return key.indexOf('cache:') === 0;
  }));
  next();
}, function(err) {
  if (err) throw err;
  if (!keysToDelete.length) {
    console.log('No keys to delete')
    process.exit()
  }
  console.log(JSON.stringify(keysToDelete, null, 2));
  yesno.ask('Delete ' + keysToDelete.length + ' keys? (y/n)', false, function(ok) {
    if (!ok) return process.exit();
    multi.del(keysToDelete);
    multi.exec(function(err) {
      if (err) throw err;
      console.log('Deleted ' + keysToDelete.length + ' keys');
      process.exit();
    });
  });
});

function redisKeys(pattern, fn, callback) {
  var complete;
  var cursor = "0";
  client.dbsize(function(err, total) {
    if (err) return callback(err);
    var processed = 0;
    var totalLen = total.toString().length;
    client.scan(cursor, "match", pattern, "count", 1000, function then(
      err,
      res
    ) {
      if (err) return callback(err);
      cursor = res[0];
      fn(res[1], function(err) {
        if (err) return callback(err);
        processed += res[1].length;
        complete = cursor === "0";
        if (complete) {
          callback(err);
        } else {
          process.stdout.write(
            pad(Math.floor((processed / total) * 100), 3, " ") +
            "% " +
            colors.dim(pad(processed, totalLen) + "/" + total + '\r')
          );
          client.scan(cursor, "match", pattern, "count", 1000, then);
        }
      });
    });
  });
}

function pad(x, len, str) {
  x = x.toString();
  while (x.length < len) x = (str || "0") + x;
  return x;
}