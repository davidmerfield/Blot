const config = require("config");
const faker = require("faker");
const async = require("async");

// Configure connection to Postgres
const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

const totalQuestions = 1000;
const questions = [];

while (questions.length < totalQuestions) {
  const replies = [];
  const totalReplies = Math.ceil(Math.random() * 10);
  while (replies.length < totalReplies) {
    replies.push({
      author: faker.name.findName(),
      body: faker.lorem.paragraphs(),
    });
  }
  questions.push({
    author: faker.name.findName(),
    title: faker.lorem.sentences(1),
    body: faker.lorem.paragraphs(),
    replies,
  });
}

async.eachSeries(
  questions,
  ({ author, title, body, replies }, next) => {
    console.log("Adding", title);
    pool.query(
      "INSERT INTO items(id, author, title, body, is_topic) VALUES(DEFAULT, $1, $2, $3, true) RETURNING *",
      [author, title, body],
      (err, { rows }) => {
        if (err) return next(err);
        const { id } = rows[0];
        async.eachSeries(
          replies,
          ({ author, body }, next) => {
            pool.query(
              "INSERT INTO items(id, author, body, parent_id) VALUES(DEFAULT, $1, $2, $3) RETURNING *",
              [author, body, id],
              next
            );
          },
          next
        );
      }
    );
  },
  (err) => {
    if (err) throw err;
    console.log("All questions added");
    process.exit();
  }
);
