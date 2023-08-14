const client = require("models/client");
const keys = require("./keys");
const get = require("./get");

module.exports = (id, updates) => {
  return new Promise((resolve, reject) => {
    const multi = client.multi();

    for (const key in updates) {
      multi.hset(keys.question(id), key, updates[key]);
    }

    // we need to update any tags
    

    multi.exec(async (err, replies) => {
      if (err) {
        reject(err);
      }

      resolve(await get(id));
    });
  });
};
