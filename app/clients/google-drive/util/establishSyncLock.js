const Sync = require("sync");
const { promisify } = require("util");

module.exports = function (blogID) {
  return new Promise((resolve, reject) => {
    Sync(blogID, function check(err, folder, done) {
      if (err) return reject(err);
      folder.update = promisify(folder.update);
      resolve({ folder, done });
    });
  });
};
