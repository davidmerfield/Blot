const key = require("./key");
const client = require("client");
const ensure = require("helper/ensure");
const { TYPE } = require("./scheme");

// We'll store only one thousand status log items
const STATUS_LOG_MAX_LENGTH = 1000;

module.exports = async function (blogID, status) {
  return new Promise((resolve, reject) => {
    ensure(blogID, "string").and(status, "object");

    // Default values
    status.datestamp =
      status.datestamp === undefined ? Date.now() : status.datestamp;
    status.error = status.error === undefined ? false : status.error;
    status.syncing = status.syncing === undefined ? false : status.error;

    ensure(status, TYPE.status, true);

    const multi = client.multi();
    const statusString = JSON.stringify(status);

    multi.hset(key.info(blogID), "status", statusString);
    multi.lpush(key.status(blogID), statusString);
    multi.ltrim(key.status(blogID), 0, STATUS_LOG_MAX_LENGTH);

    multi.exec((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
};
