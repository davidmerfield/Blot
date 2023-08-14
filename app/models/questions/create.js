const client = require("models/client");
const keys = require("./keys");

module.exports = async function ({ title, tags = [], body }) {
  const id = await client.incr(keys.id);
  const multi = client.multi();
  const created_at = Date.now();
  const reply_count = 0;
  const question = {
    id,
    title,
    tags,
    body,
    created_at,
  };

  console.log(question);

  multi.hset(keys.question(id), question);

  tags.forEach((tag) => {
    multi.zadd(keys.list.tag(tag), created_at, id);
  });

  multi.zadd(keys.list.date, created_at, id);
  multi.zadd(keys.list.replies, reply_count, id);

  const replies = await multi.exec();

  return id;
};
