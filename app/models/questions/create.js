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
        last_reply_created_at: created_at,
      });

      // This is a reply
      if (parent_id) {
        multi.zadd(keys.replies(parent_id), created_at, id);
        multi.hset(keys.question(parent_id), "last_reply_created_at", created_at);
        multi.zadd(keys.list.date, created_at, parent_id);

        // This is a new question
      } else {
        tags.forEach((tag) => {
          multi.sadd(keys.tags, tag);
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
