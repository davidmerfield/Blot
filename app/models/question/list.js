const PAGE_SIZE = 10;
const client = require("models/client");
const keys = require("./keys");
const moment = require("moment");

module.exports = ({
  page = 1,
  tag = "",
  page_size = PAGE_SIZE,
  sort = 'by_last_reply'
} = {}) => {
  return new Promise((resolve, reject) => {
    const startIndex = (page - 1) * page_size;
    const endIndex = startIndex + page_size - 1;

    const key = tag
      ? keys.by_tag(tag)
      : sort === 'by_created'
      ? keys.by_created
      : sort === 'by_number_of_replies' 
      ? keys.by_number_of_replies :
      keys.by_last_reply;
      

    client
      .batch()
      .zcard(key)
      .zrevrange(key, startIndex, endIndex)
      .exec((err, [total, question_ids]) => {
        if (err) {
          reject(err);
        }

        const batch = client.batch();

        if (!question_ids.length) {
          return resolve({ questions: [], stats: { total, page_size, page } });
        }

        question_ids.forEach(id => {
          batch.hgetall(keys.item(id));
          batch.zscore(keys.by_last_reply, id);
          batch.zscore(keys.by_number_of_replies, id);
        });

        batch.exec((err, results) => {
          if (err) {
            reject(err);
          }

          const questions = results
            .filter((_, index) => index % 3 === 0)
            .map((question, index) => {
              const last_reply_created_at = results[index * 3 + 1];
              const number_of_replies = results[index * 3 + 2];

              const date = new Date(parseInt(last_reply_created_at));
              question.last_reply_created_at = last_reply_created_at;
              question.time = moment(date).fromNow();
              question.number_of_replies = parseInt(number_of_replies);

              try {
                question.tags = JSON.parse(question.tags);
              } catch (err) {
                question.tags = [];
              }

              return question;
            })
            .filter(question => question.title && !!question.title.trim());

          resolve({ questions, stats: { total, page_size, page } });
        });
      });
  });
};
