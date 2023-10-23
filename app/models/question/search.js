const client = require("models/client");
const keys = require("./keys");
const PAGE_SIZE = 20;

module.exports = ({ query, page = 1, page_size = PAGE_SIZE } = {}) => {
  return new Promise((resolve, reject) => {
    const key = keys.all_questions;
    const questions = [];
    const cursor = 0;

    const iterate = (err, [cursor, ids]) => {
      if (err) {
        return reject(err);
      }

      console.log("here", cursor, ids);

      const batch = client.batch();

      ids.forEach(id => {
        batch.hgetall(keys.item(id));
      });

      batch.exec((err, results) => {
        if (err) {
          return reject(err);
        }

        results.forEach(result => {
          if (
            result.title.toLowerCase().includes(query) ||
            result.body.toLowerCase().includes(query)
          ) {
            questions.push({
              title: result.title,
              url: `/questions/${result.id}`
            });
          }
        });

        // we have enough questions to fill a page
        if (questions.length >= page_size * page) {
          const pageOfQuestions = questions.slice(
            page_size * (page - 1),
            page_size * page
          );
          return resolve(pageOfQuestions);

          // we have reached the end of the questions and there are no more questions to retrieve
        } else if (cursor === "0") {
          return resolve(questions);
        } else {
          return client.sscan(key, cursor, iterate);
        }
      });
    };

    // iterate over the question ids, retrieve the title, and body of each question and see if they contain the query
    client.sscan(key, cursor, iterate);
  });
};
