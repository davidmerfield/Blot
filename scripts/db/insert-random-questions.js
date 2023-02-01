const config = require("config");
const faker = require("faker");
const async = require("async");
const fs = require("fs-extra");

const walk = (dir) => {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {

    file = dir + "/" + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
};

const urlFromFilename = function (path) {
  if (path.endsWith('index.html')) return require('path').basename(require('path').dirname(path))
  return path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")).toLowerCase();
}

const slugs = walk(require("helper/rootDir") + "/app/brochure/views")
.filter(path => path.endsWith('.html'))
  .map(urlFromFilename)
  .filter((x, i, a) => a.indexOf(x) === i).sort();

const randomSlug = () => slugs[Math.floor(Math.random() * slugs.length)];

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
    title: faker.lorem.sentences(1).slice(0, -1) + '?',
    tags: randomSlug() + "," + randomSlug() + "," + randomSlug(),
    body: faker.lorem.paragraphs(),
    replies,
  });
}

async.eachSeries(
  questions,
  ({ author, title, body, tags, replies }, next) => {
    console.log("Adding", title);
    pool.query(
      "INSERT INTO items(id, author, title, body, tags, is_topic) VALUES(DEFAULT, $1, $2, $3, $4, true) RETURNING *",
      [author, title, body, tags],
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
