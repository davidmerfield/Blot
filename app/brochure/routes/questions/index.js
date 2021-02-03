const Express = require("express");
const Questions = new Express.Router();
const hbs = require("hbs");
const moment = require("moment");
const csrf = require("csurf")();
const config = require("config");
const marked = require("marked");

// Configure connection to Postgres
const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

// Renders datetime in desired format
// Can be used like so: {{{formatDaytime D}}} where D is timestamp (e.g. from a DB)
hbs.registerHelper("formatDaytime", function (timestamp) {
  try {
    timestamp = moment.utc(timestamp).startOf("minute").fromNow();
  } catch (e) {
    timestamp = "";
  }
  return timestamp;
});

Questions.use(
  Express.urlencoded({
    extended: true,
  })
);

Questions.use(function (req, res, next) {
  res.locals.base = "/questions";
  // The rest of these pages should not be cached
  res.header("Cache-Control", "no-cache");
  next();
});

// Handle topic listing
// Topics are sorted by datetime of last reply, then by topic creation date
Questions.get("/", function (req, res) {
  pool
    .query(
      `SELECT i.*, last_reply_created_at, COUNT(r.parent_id) AS reply_count
                FROM items i
                LEFT JOIN items r ON r.parent_id = i.id
                    LEFT JOIN (
                        SELECT parent_id, MAX(created_at) last_reply_created_at 
                        FROM items GROUP BY parent_id
                        ) r2 
                    ON r2.parent_id = i.id
                WHERE i.is_topic = true 
                GROUP BY i.id, last_reply_created_at
                ORDER BY last_reply_created_at, i.created_at DESC NULLS LAST`
    )
    .then((topics) =>
      res.render("questions", { title: "Blot — Questions", topics: topics.rows })
    )
    .catch((err) => {
      throw err;
    });
});

// Handle topic viewing and creation
Questions.route("/new")
  .get(csrf, function (req, res) {
    res.locals.csrf = req.csrfToken();
    res.render("questions/new");
  })
  .post(csrf, function (req, res) {
    const author = req.user.uid;
    const title = req.body.title;
    const body = req.body.body;
    // Disallow empty title or body.
    // TODO: show error message, do not lose form data
    if (title.trim().length === 0 || body.trim().length === 0)
      res.redirect("/questions/new");
    else {
      pool.query(
        "INSERT INTO items(id, author, title, body, is_topic) VALUES(DEFAULT, $1, $2, $3, true) RETURNING *",
        [author, title, body],
        (error, topic) => {
          if (error) {
            throw error;
          }
          const newTopic = topic.rows[0];
          res.redirect("/questions/" + newTopic.id);
        }
      );
    }
  });

// Handle new reply to topic
Questions.route("/:id/new").post(csrf, function (req, res) {
  const id = parseInt(req.params.id);
  const author = req.user.uid;
  const body = req.body.body;
  if (body.trim().length === 0) res.redirect("/questions/" + id);
  else {
    pool
      .query(
        "INSERT INTO items(id, author, body, parent_id) VALUES(DEFAULT, $1, $2, $3) RETURNING *",
        [author, body, id]
      )
      .then((item) => res.redirect("/questions/" + id))
      .catch((err) => {
        throw err;
      });
  }
});

Questions.route("/:id").get(csrf, function (req, res) {
  res.locals.csrf = req.csrfToken();
  const id = parseInt(req.params.id);
  pool
    .query("SELECT * FROM items WHERE id = $1 AND is_topic = true", [id])
    .then((topics) => {
      pool
        .query(
          "SELECT * FROM items WHERE parent_id = $1 AND is_topic = false",
          [id]
        )
        .then((replies) => {
          let topic = topics.rows[0];
          topic.body = marked(topic.body);
          res.locals.breadcrumbs = res.locals.breadcrumbs.slice(0, -1);
          replies.rows.forEach(
            (el, index) => (replies.rows[index].body = marked(el.body))
          );
          res.render("questions/topic", {
            title: topic.title,
            topics: replies.rows,
            topic: topic,
          });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      throw err;
    });
});

module.exports = Questions;
