const client = require("models/client");
const keys = require("./keys");

module.exports = function ({
  title = "",
  tags = [],
  body = "",
  parent_id = 0,
}) {
  return new Promise((resolve, reject) => {
    client.incr(keys.id, (err, id) => {
      if (err) {
        return reject(err);
      }

      id = id.toString();

      const created_at = Date.now();
      const reply_count = 0;
      const question = {
        id,
        parent_id,
        title,
        body,
        created_at,
      };

      const multi = client.multi();
      multi.hmset(keys.question(id), {
        id,
        parent_id,
        title,
        tags: JSON.stringify(tags),
        body,
        created_at,
      });

      if (parent_id) {
        tags.forEach((tag) => {
          multi.zadd(keys.list.tag(tag), created_at, id);
        });

        multi.zadd(keys.list.date, created_at, id);
        multi.zadd(keys.list.replies, reply_count, id);
      }

      multi.exec((err, replies) => {
        if (err) {
          return reject(err);
        }

        resolve(id);
      });
    });
  });
};
