const client = require("models/client");
const keys = require("./keys");
const moment = require("moment");

module.exports = id => {
  return new Promise((resolve, reject) => {
    client
      .batch()
      .zrange(keys.children(id), 0, -1)
      .hgetall(keys.item(id))
      .zscore(keys.by_last_reply, id)
      .exec((err, [reply_ids, question, last_reply_created_at]) => {
        if (err) {
          return reject(err);
        }

        if (!question) return resolve(null);

        const batch = client.batch();

        reply_ids.forEach(reply_id => {
          batch.hgetall(keys.item(reply_id));
        });

        batch.exec((err, replies) => {
          if (err) {
            return reject(err);
          }

          try {
            question.tags = JSON.parse(question.tags);
          } catch (e) {
            question.tags = [];
          }

          question.replies = replies.map(reply => {
            const date = new Date(parseInt(reply.created_at));
            reply.time = moment(date).fromNow();
            return reply;
          });

          const date = new Date(parseInt(last_reply_created_at));

          question.number_of_replies = replies.length;
          question.last_reply_created_at = last_reply_created_at;
          question.time = moment(date).fromNow();

          resolve(question);
        });
      });
  });
};
