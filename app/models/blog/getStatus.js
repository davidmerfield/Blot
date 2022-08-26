const key = require("./key");
const client = require("client");

module.exports = function (
  blogID,
  options = { limit: 1, offset: 0 },
  callback
) {
  client.lrange(key.status(blogID), offset, offset + limit, function (
    err,
    items
  ) {
    if (err) return callback(err);
    items = items.map(JSON.stringify);
    callback(null, items);
  });
};
