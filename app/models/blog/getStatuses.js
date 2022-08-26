const key = require("./key");
const client = require("client");

module.exports = function (blogID, callback) {
  const offset = 0;
  const limit = 100;

  client.lrange(key.status(blogID), offset, offset + limit, function (
    err,
    items
  ) {
    if (err) return callback(err);
    items = items.map(JSON.parse);
    callback(null, items);
  });
};
