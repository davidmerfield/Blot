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

// QA Forum View Configuration
const TOPICS_PER_PAGE = 20;

// Renders datetime in desired format
// Can be used like so: {{{formatDaytime D}}} where D is timestamp (e.g. from a DB)
hbs.registerHelper("formatDaytime", function (timestamp) {
  try {
    timestamp = moment.utc(timestamp).format("MMM D [']YY [at] H:mm");
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
Questions.get(["/", "/page/:page"], function (req, res, next) {
  // Pagination data
  const page = req.params.page ? parseInt(req.params.page) : 1;
  if (!Number.isInteger(page)) {
    return next();
  }
  const offset = (page - 1) * TOPICS_PER_PAGE;

  // Search data
  const search_query = req.query.search; // raw query from form
  let search_arr = ["%"]; // array for Postgres; initial value is needed for empty search query case
  if (search_query) {
    // populate with words from query    add '%' prefix and postfix for Postgres pattern matching
    search_arr = search_query.split(" ").map((el) => "%" + el + "%");
    res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label =
      "Questions about " + search_query.split(/[ ,]+/).join(", ");
  } else {
    res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label =
      "Questions";
  }

  const search_arr_str = JSON.stringify(search_arr).replace(/"/g, "'"); // stringify and replace double quotes with single quotes for Postgres

  pool
    .query(
      `SELECT i.*, last_reply_created_at, COUNT(r.parent_id) AS reply_count, COUNT(r.parent_id) > 0 AS has_replies, COUNT(*) OVER() AS topics_count
                FROM items i
                LEFT JOIN items r ON r.parent_id = i.id
                    LEFT JOIN (
                        SELECT parent_id, MAX(created_at) last_reply_created_at 
                        FROM items GROUP BY parent_id
                        ) r2 
                    ON r2.parent_id = i.id
                WHERE i.is_topic = true AND (i.body ILIKE any (array[${search_arr_str}]) OR i.title ILIKE any (array[${search_arr_str}]))
                GROUP BY i.id, last_reply_created_at
                ORDER BY has_replies, i.created_at DESC
                LIMIT ${TOPICS_PER_PAGE}
                OFFSET ${offset}`
    )
    .then((topics) => {
      if (topics.rows.length === 0) return next();

      // Paginator object for the view
      let paginator = {};

      // We preview one line of the topic body on the question index page
      topics.rows.forEach(function (topic) {
        topic.body = marked(topic.body);
      });

      // Data for pagination
      let pages_count = Math.ceil(
        topics.rows[0].topics_count / TOPICS_PER_PAGE
      ); // total pages
      let next_page = false;
      if (page < pages_count) next_page = page + 1; // next page value only if current page is not last

      if (pages_count > 1) {
        // create paginator only if there are more than 1 pages
        paginator = {
          pages: [], // array of pages [{page: 1, current: true}, {...}, ... ]
          next_page: next_page, // next page int
          topics_count: topics.rows[0].topics_count, // total number of topics
        };
        for (let i = 1; i <= pages_count; i++) {
          // filling pages array
          if (i === page) {
            paginator.pages.push({ page: i, current: true });
          } else paginator.pages.push({ page: i, current: false });
        }
      }

      if (req.params.page) {
        res.locals.breadcrumbs = res.locals.breadcrumbs.slice(0, -2);
      }

      res.render("questions", {
        title: "Blot — Questions",
        topics: topics.rows,
        paginator: paginator,
        search_query: search_query,
      });
    })
    .catch(next);
});

// Handle topic viewing and creation
Questions.route("/ask")
  .get(csrf, function (req, res) {
    res.locals.csrf = req.csrfToken();
    res.render("questions/ask");
  })
  .post(csrf, function (req, res) {
    const author = req.user.uid;
    const title = req.body.title;
    const body = req.body.body;
    // Disallow empty title or body.
    // TODO: show error message, do not lose form data
    if (title.trim().length === 0 || body.trim().length === 0)
      res.redirect("/questions/ask");
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
Questions.route("/:id/new").post(csrf, function (req, res, next) {
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
      .then(() => res.redirect("/questions/" + id))
      .catch(next);
  }
});

Questions.route("/:id/edit")
  .get(csrf, function (req, res, next) {
    const id = parseInt(req.params.id);
    pool
      .query("SELECT * FROM items WHERE id = $1", [id])
      .then((topics) => {
        let topic = topics.rows[0];

        if (!topic) return next();

        res.locals.breadcrumbs[res.locals.breadcrumbs.length - 2].label =
          topic.title || "Answer";
        res.render("questions/edit", {
          topic,
          csrf: req.csrfToken(),
        });
      })
      .catch(next);
  })
  .post(csrf, function (req, res, next) {
    const id = parseInt(req.params.id);
    const title = req.body.title || "";
    const body = req.body.body;
    let query;
    let queryParameters;

    // For updating questions
    if (title) {
      query = `UPDATE items SET title=$1, body=$2 WHERE id = $3 RETURNING *`;
      queryParameters = [title, body, id];
      // For updating answers
    } else {
      query = `UPDATE items SET body=$1 WHERE id = $2 RETURNING *`;
      queryParameters = [body, id];
    }

    pool
      .query(query, queryParameters)
      .then((result) => {
        let topic = result.rows[0];
        let redirect = "/questions/" + topic.id;
        if (topic.parent_id !== null)
          redirect = "/questions/" + topic.parent_id;
        res.redirect(redirect);
      })
      .catch(next);
  });

Questions.route("/:id").get(csrf, function (req, res, next) {
  res.locals.csrf = req.csrfToken();
  const id = parseInt(req.params.id);
  pool
    .query("SELECT * FROM items WHERE id = $1 AND is_topic = true", [id])
    .then((topics) => {
      pool
        .query(
          "SELECT * FROM items WHERE parent_id = $1 AND is_topic = false ORDER BY created_at ASC",
          [id]
        )
        .then((replies) => {
          let topic = topics.rows[0];

          if (!topic) return next();

          topic.body = marked(topic.body);
          res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label =
            topic.title;
          replies.rows.forEach(
            (el, index) => (replies.rows[index].body = marked(el.body))
          );
          res.render("questions/topic", {
            title: topic.title,
            topics: replies.rows,
            topic: topic,
          });
        })
        .catch(next);
    })
    .catch(next);
});

module.exports = Questions;
