const client = require("models/client");
const keys = require("./keys");
const moment = require("moment");

module.exports = (id) => {
  return new Promise((resolve, reject) => {
    client
      .batch()
      .zrevrange(keys.replies(id), 0, -1)
      .hgetall(keys.question(id))
      .exec((err, [reply_ids, question]) => {
        if (err) {
          return reject(err);
        }

        const batch = client.batch();

        reply_ids.forEach((reply_id) => {
          batch.hgetall(keys.question(reply_id));
        });

        batch.exec((err, replies) => {
          if (err) {
            return reject(err);
          }

          question.tags = JSON.parse(question.tags);
          question.created_at = new Date(parseInt(question.created_at, 10));
          question.replies = replies;
          question.time = moment.unix(question.last_reply_at).fromNow();

          resolve(question);
        });
      });
  });
};
