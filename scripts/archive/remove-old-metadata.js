var client = require("redis").createClient();

iterate("0", function(err) {
  throw err;
});

function iterate(cursor, callback) {
  var keys, done;

  client.scan(cursor, "match", "blog:*:folder:*", function(err, res) {
    if (err) return callback(err);

    cursor = res[0];
    keys = res[1];
    done = cursor === "0";

    keys.forEach(function(key) {
      var expected_id = key.slice("blog:".length, key.indexOf(":folder:"));
      var isnum = /^\d+$/.test(expected_id);

      if (
        expected_id.length > 3 ||
        isnum === false ||
        parseInt(expected_id).toString() !== expected_id
      ) {
        console.log(
          "ERROR",
          key,
          isnum,
          parseInt(expected_id).toString() !== expected_id
        );
      }
    });

    if (!keys.length && done) {
      callback();
    } else if (!keys.length && !done) {
      iterate(cursor, callback);
    } else {
      client.del(keys, function(err) {
        if (err) return callback(err);

        if (done) {
          callback();
        } else {
          iterate(cursor, callback);
        }
      });
    }
  });
}
