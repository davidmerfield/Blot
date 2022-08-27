const key = require("./key");
const client = require("client");
const ensure = require("helper/ensure");

module.exports = function (blogID, options, callback) {
  if (typeof options === "function" && callback === undefined) {
    callback = options;
    options = {};
  }

  ensure(blogID, "string").and(options, "object").and(callback, "function");

  // Fetch the first page by default
  const page = options.page === undefined ? 1 : options.page;

  // Use a page size of 100 by default
  const pageSize = options.pageSize === undefined ? 100 : options.pageSize;

  const offset = (page - 1) * pageSize;

  // We remove one because, per the redis docs:
  // > Note that if you have a list of numbers from 0 to 100,
  // > LRANGE list 0 10 will return 11 elements, that is, the
  // > rightmost item is included. This may or may not be
  // > consistent with behavior of range-related functions in
  // > your programming language of choice.
  const limit = offset + pageSize - 1;

  ensure(offset, "number")
    .and(limit, "number")
    .and(page, "number")
    .and(pageSize, "number");

  client.lrange(key.status(blogID), offset, limit, function (err, items) {
    if (err) return callback(err);
    items = items.map(JSON.parse);
    callback(null, items);
  });
};
