const key = require("./key");
const client = require("client");
const ensure = require("helper/ensure");
const { TYPE } = require("./scheme");

// We'll store only two thousand status log items
const STATUS_LOG_MAX_LENGTH = 2000;

module.exports = function (blogID, status, callback) {
  ensure(blogID, "string").and(status, "object");

  // Default values
  status.datestamp =
    status.datestamp === undefined ? Date.now() : status.datestamp;
  status.syncID = status.syncID === undefined ? "" : status.syncID;

  ensure(status, TYPE.status, true);

  const multi = client.multi();
  const statusString = JSON.stringify(status);

  multi.hset(key.info(blogID), "status", statusString);
  multi.lpush(key.status(blogID), statusString);
  multi.ltrim(key.status(blogID), 0, STATUS_LOG_MAX_LENGTH);

  multi.exec(callback);
};
