const PAGE_SIZE = 10;
const client = require("models/client");
const keys = require("./keys");
const moment = require("moment");

module.exports = ({ page = 1, tag = "" } = {}) => {
  return new Promise((resolve, reject) => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE - 1;

    const key = tag ? keys.list.tag(tag) : keys.list.date;

    client
      .batch()
      .zcard(key)
      .zrevrange(key, startIndex, endIndex)
      .exec((err, [total, question_ids]) => {
        if (err) {
          reject(err);
        }

        const batch = client.batch();

        question_ids.forEach((id) => {
          batch.hgetall(keys.question(id));
        });

        batch.exec((err, questions) => {
          if (err) {
            reject(err);
          }

          questions = questions.map((question) => {
            question.tags = JSON.parse(question.tags);
            question.time = moment
              .unix(question.last_reply_created_at)
              .fromNow();
            return question;
          });

          resolve({ questions, stats: { total, page_size: PAGE_SIZE, page } });
        });
      });
  });
};
