const PAGE_SIZE = 10;
const client = require("models/client");
const keys = require("./keys");

module.exports = ({ page = 1, tag = "" } = {}) => {
  return new Promise((resolve, reject) => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE - 1;

    const key = tag ? keys.list.tag(tag) : keys.list.date;

    client.zrevrange(key, startIndex, endIndex, (err, question_ids) => {
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

        resolve(questions);
      });
    });
  });
};
