const client = require("models/client");
const keys = require("./keys");
const get = require("./get");

module.exports = async function ({
  id = "",
  title = "",
  tags = [],
  body = "",
  parent_id = 0,
}) {
  if (!id) id = await generateQuestionID();

  // unix timestamp converted to string
  const created_at = Date.now().toString();
  const reply_count = 0;
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

  return new Promise((resolve, reject) => {
    multi.exec((err) => {
      if (err) return reject(err);
      // resolve with the question retrieved from the database
      get(id).then(resolve).catch(reject);
    });
  });
};

function generateQuestionID() {
  return new Promise((resolve, reject) => {
    client.incr(keys.id, (err, id) => {
      if (err) return reject(err);
      resolve(id.toString());
    });
  });
}
