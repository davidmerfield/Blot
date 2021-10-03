const Sync = require("sync");
const { promisify } = require("util");
const opts = {
  retryCount: 1,
  retryDelay: 100,
  retryJitter: 10,
  ttl: 30 * 60 * 1000, // 30 minutes
};

module.exports = function (blogID) {
  return new Promise((resolve, reject) => {
    Sync(blogID, opts, function check(err, folder, done) {
      if (err) return reject(err);
      folder.update = promisify(folder.update);
      resolve({ folder, done });
    });
  });
};
