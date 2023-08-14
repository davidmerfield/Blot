const client = require("models/client");
const keys = require("./keys");

module.exports = (id) => {
  return new Promise((resolve, reject) => {
    client.hgetall(keys.question(id), (err, question) => {
      if (err) {
        return reject(err);
      }

      resolve(question);
    });
  });
};
