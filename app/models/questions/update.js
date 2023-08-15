const client = require("models/client");
const keys = require("./keys");
const get = require("./get");

module.exports = (id, updates) => {
  return new Promise(async (resolve, reject) => {
    const existing = await get(id);
    const multi = client.multi();
    const created_at = existing.created_at || updates.created_at || Date.now();

    if (!updates.created_at) updates.created_at = created_at;

    for (const key in updates) {
      let value = updates[key];

      if (typeof value === "object" || Array.isArray(value)) {
        value = JSON.stringify(value);
      } else if (typeof value === "boolean") {
        value = value ? "true" : "false";
      } else if (typeof value === "number") {
        value = value.toString();
      }

      multi.hset(keys.question(id), key, value);
    }

    // we need to update any tags
    if (updates.tags) {
      for (const tag of updates.tags) {
        multi.sadd(keys.tags, tag);
        multi.zadd(keys.list.tag(tag), created_at, id);
      }

      for (const tag of existing.tags) {
        if (!updates.tags.includes(tag)) {
          console.log("removing tag", tag, "from", id);
          multi.zrem(keys.list.tag(tag), id);
        }
      }
    }

    multi.exec((err, replies) => {
      if (err) {
        reject(err);
      }

      // clean up any tags that are no longer used
      const batch = client.batch();

      for (const tag of existing.tags) {
        batch.zcard(keys.list.tag(tag));
      }

      batch.exec(async (err, replies) => {
        if (err) {
          reject(err);
        }

        let tagMulti = client.multi();

        for (let i = 0; i < replies.length; i++) {
          if (replies[i] === 0) {
            tagMulti.srem(keys.tags, existing.tags[i]);
          }
        }

        tagMulti.exec(async (err, replies) => {
          if (err) {
            reject(err);
          }
          resolve(await get(id));
        });
      });
    });
  });
};
