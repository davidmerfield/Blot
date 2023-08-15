const Express = require("express");
const urlencoded = Express.urlencoded({
  extended: true,
});

const Questions = new Express.Router();
const moment = require("moment");
const config = require("config");
const async = require("async");
const cache = require("helper/express-disk-cache")(config.cache_directory);
const flushOptions = { host: config.host, path: "/https/temporary/questions" };
const flush = () => cache.flush(flushOptions);
const questions = require("models/questions");
const render = require("./render");
const Paginator = require("./paginator");

Questions.use(["/ask", "/:id/edit", "/:id/new"], require("dashboard/session"));
Questions.use(["/ask", "/:id/edit", "/:id/new"], urlencoded);

Questions.use(async (req, res, next) => {
  res.locals.popular_tags = await questions.tags();
  next();
});

Questions.use(function (req, res, next) {
  res.locals.base = "/questions";
  res.locals["show-question-sidebar"] = true;
  res.locals["hide-on-this-page"] = true;
  // The rest of these pages should not be cached
  next();
});

Questions.get("/feed.rss", async function (req, res) {
  res.locals.url = config.protocol + config.host;
  res.locals.title = "Questions";
  res.locals.topics = await questions.list({ created_at: true });

  // We preview one line of the topic body on the question index page
  res.locals.topics.forEach(function (topic) {
    topic.body = render(topic.body);
    topic.url = res.locals.url + "/questions/" + topic.id;
    topic.author = "Anonymous";
    topic.date = moment
      .utc(topic.created_at)
      .format("ddd, DD MMM YYYY HH:mm:ss ZZ");
  });

  const template = await require("fs-extra").readFile(
    req.app.get("views") + "/questions/_feed.rss",
    "utf-8"
  );
  const result = require("mustache").render(template, res.locals);

  res.set("Content-type", "text/xml;charset=UTF-8");
  res.set("Pragma", "public");
  res.set("Cache-control", "private");
  res.set("Expires", "-1");

  res.send(result);
});

// Handle topic listing
// Topics are sorted by datetime of last reply, then by topic creation date
Questions.get(["/", "/page/:page"], async function (req, res, next) {
  
  const page = req.params.page ? parseInt(req.params.page) : 1;

  if (!Number.isInteger(page)) {
    return next();
  }

  const TOPICS_PER_PAGE = 10;
  const TOTAL_TOPICS = 100;
  
  res.locals.topics = await questions.list({ page });

  // We preview one line of the topic body on the question index page
  res.locals.topics.forEach(function (topic) {
    topic.body = render(topic.body);
    topic.singular = topic.reply_count === "1";

    if (topic.last_reply_created_at) {
      topic.answered = moment(topic.last_reply_created_at).fromNow();
      topic.answeredDateStamp = moment(topic.last_reply_created_at).valueOf();
    }

    if (topic.created_at) {
      topic.asked = moment(topic.created_at).fromNow();
      topic.askedDateStamp = moment(topic.created_at).valueOf();
    }
  });

  res.locals.title = page > 1 ? `Page ${page} - Questions` : "Questions";
  res.locals.paginator = Paginator(
    page,
    TOPICS_PER_PAGE,
    TOTAL_TOPICS,
    "/questions"
  );

  res.render("questions");
});

Questions.route(["/tags", "/tags/page/:page"]).get(async function (
  req,
  res,
  next
) {
  const page = req.params.page ? parseInt(req.params.page) : 1;

  if (page && !Number.isInteger(page)) {
    return next();
  }

  const TOTAL_TOPICS = 100;
  const TAGS_PER_PAGE = 10;

  res.locals.title = page > 1 ? `Page ${page} - Tags` : "Tags";
  res.locals.paginator = Paginator(
    page,
    TAGS_PER_PAGE,
    TOTAL_TOPICS,
    "/questions/tags"
  );
  res.locals.tags = await questions.tags({ page });
  res.render("questions/tags");
});

// Handle topic viewing and creation
Questions.route("/ask")
  .get(function (req, res) {
    if (!req.session || !req.session.uid)
      return res.redirect("/log-in?then=/questions/ask");
    res.render("questions/ask");
  })
  .post(function (req, res, next) {
    if (!req.session || !req.session.uid)
      return res.redirect("/log-in?then=/questions/ask");
    const author = req.session.uid;
    const title = req.body.title;
    const tags = req.body.tags;
    const body = req.body.body;
    // Disallow empty title or body.
    // TODO: show error message, do not lose form data
    if (title.trim().length === 0 || body.trim().length === 0)
      return next(new Error("Title and body must be set"));
    else {
      // insert
      //  [author, title, body, tags]
      // res.redirect("/questions/" + newTopic.id);
    }
  });

// Handle new reply to topic
Questions.route("/:id/new").post(function (req, res, next) {
  const id = parseInt(req.params.id);
  if (!req.session || !req.session.uid)
    return res.redirect(`/log-in?then=/questions/${id}/new`);
  const author = req.session.uid;
  const body = req.body.body;
  if (body.trim().length === 0) res.redirect("/questions/" + id);
  else {
  }
});

Questions.route("/:id/edit")
  .get(function (req, res, next) {
    const id = parseInt(req.params.id);
    if (!req.session || !req.session.uid)
      return res.redirect(`/log-in?then=/questions/${id}/edit`);
    pool
      .query("SELECT * FROM items WHERE id = $1", [id])
      .then((topics) => {
        let topic = topics.rows[0];

        if (!topic) return next();

        let penultimateBreadcrumb =
          res.locals.breadcrumbs[res.locals.breadcrumbs.length - 2];

        // If this is a question or an answer
        if (topic.is_topic) {
          penultimateBreadcrumb.label = topic.title;
        } else {
          penultimateBreadcrumb.label = "Answer";
          penultimateBreadcrumb.url = `/questions/${topic.parent_id}`;
        }

        res.locals.topic = topic;
        res.render("questions/edit");
      })
      .catch(next);
  })
  .post(function (req, res, next) {
    const id = parseInt(req.params.id);
    if (!req.session || !req.session.uid)
      return res.redirect(`/log-in?then=/questions/${id}/edit`);
    const title = req.body.title || "";
    const body = req.body.body;
    const tags = req.body.tags || "";
    let query;
    let queryParameters;

    // For updating questions
    if (title) {
      query = `UPDATE items SET title=$1, body=$2, tags=$3 WHERE id = $4 RETURNING *`;
      queryParameters = [title, body, tags, id];
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
        flush();
        res.redirect(redirect);
      })
      .catch(next);
  });

Questions.route("/:id").get(function (req, res, next) {
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

          topic.body = render(topic.body);

          topic.reply_count = replies.rows.length;
          if (topic.tags)
            topic.tags = topic.tags
              .split(",")
              .map((tag) => ({ tag, slug: tag }));
          topic.asked = moment(topic.created_at).fromNow();
          topic.askedDateStamp = moment(topic.created_at).valueOf();
          res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label =
            topic.title;
          replies.rows.forEach((el, index) => {
            replies.rows[index].body = render(el.body);
            replies.rows[index].answered = moment(
              replies.rows[index].created_at
            ).fromNow();
            replies.rows[index].answeredDateStamp = moment(
              replies.rows[index].created_at
            ).valueOf();
          });
          res.locals.title = topic.title;
          res.locals.topics = replies.rows;
          res.locals.topic = topic;
          res.render("questions/topic");
        })
        .catch(next);
    })
    .catch(next);
});

Questions.route("/tagged/:tag/edit")

  .get(async function (req, res, next) {
    const tag = req.params.tag;
    const { rows } = await pool.query(
      `SELECT count(*) AS total_affected FROM items WHERE tags ILIKE '%' || $1 || '%'`,
      [tag]
    );
    const total_affected = rows[0].total_affected;

    res.locals.tag = tag;
    res.locals.total_affected = total_affected;
    res.render("questions/edit-tag.html");
  })
  .post(async function (req, res, next) {
    const previousTag = req.body.previousTag;
    const tag = req.body.tag;
    const { rows } = await pool.query(
      `SELECT tags, id FROM items WHERE tags ILIKE '%' || $1 || '%'`,
      [previousTag]
    );
    async.eachSeries(
      rows,
      ({ tags, id }, next) => {
        tags = tags
          .split(",")
          .map((t) => (t === previousTag ? tag : t))
          .join(",");
        pool.query(
          `UPDATE items SET tags = $1 WHERE id = $2;`,
          [tags, id],
          next
        );
      },
      (err) => {
        if (err) return next(err);
        flush();
        res.redirect(req.baseUrl + "/tagged/" + tag);
      }
    );
  });

Questions.get(
  ["/tagged/:tag", "/tagged/:tag/page/:page"],
  function (req, res, next) {
    // Pagination data
    if (req.params.page === "1")
      return res.redirect(req.baseUrl + `/tagged/${req.params.tag}`);

    const page = req.params.page ? parseInt(req.params.page) : 1;
    const tag = req.params.tag;

    if (!Number.isInteger(page)) {
      return next();
    }

    if (!tag) {
      return next();
    }

    res.locals.breadcrumbs = res.locals.breadcrumbs.filter(
      (x, i) => i !== res.locals.breadcrumbs.length - 2
    );

    res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label =
      "Tagged '" + tag + "'";

    const offset = (page - 1) * TOPICS_PER_PAGE;

    // Search data
    const search_query = req.query.search; // raw query from form
    let search_arr = ["%"]; // array for Postgres; initial value is needed for empty search query case
    // populate with words from query    add '%' prefix and postfix for Postgres pattern matching
    search_arr = tag.split(" ").map((el) => "%" + el + "%");

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
                WHERE i.is_topic = true AND (i.tags ILIKE any (array[${search_arr_str}]))
                GROUP BY i.id, last_reply_created_at
                ORDER BY has_replies, last_reply_created_at DESC
                LIMIT ${TOPICS_PER_PAGE}
                OFFSET ${offset}`
      )
      .then((topics) => {
        if (topics.rows.length === 0) return next();

        // We preview one line of the topic body on the question index page
        topics.rows.forEach(function (topic) {
          topic.body = render(topic.body);
          if (topic.tags)
            topic.tags = topic.tags
              .split(",")
              .map((tag) => ({ tag, slug: tag }));
          topic.asked = moment(topic.created_at).fromNow();
          topic.askedDateStamp = moment(topic.created_at).valueOf();
        });

        res.locals.tag = tag;
        res.locals.title = page > 1 ? `Page ${page} - Questions` : "Questions";
        res.locals.topics = topics.rows;
        res.locals.paginator = Paginator(
          page,
          TOPICS_PER_PAGE,
          topics.rows[0].topics_count,
          "/questions/tagged/" + tag
        );
        res.locals.search_query = search_query;
        res.render("questions");
      })
      .catch(next);
  }
);

module.exports = Questions;
