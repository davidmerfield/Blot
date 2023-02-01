const Express = require("express");
const Questions = new Express.Router();
const moment = require("moment");
const csrf = require("csurf")();
const config = require("config");
const marked = require("marked");
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

// QA Forum View Configuration
const TOPICS_PER_PAGE = 20;

Questions.use(
  Express.urlencoded({
    extended: true,
  })
);

Questions.use(async (req, res, next) => {
  const { rows } = await pool.query(
    `SELECT taglist.tag,
       (SELECT Count(*)
        FROM   items
        WHERE  items.tags LIKE '%'
                               || taglist.tag
                               || '%') AS total,
    COUNT(*) OVER() AS tags_count                               
FROM   (SELECT DISTINCT Unnest(String_to_array(tags, ',')) AS tag
        FROM   items) taglist
ORDER BY total DESC
LIMIT ${10}`
  );
  res.locals.popular_tags = rows;
  next();
});

Questions.use(function (req, res, next) {
  res.locals.base = "/questions";
  res.locals["show-question-sidebar"] = true;
  res.locals["hide-on-this-page"] = true;
  // The rest of these pages should not be cached
  res.header("Cache-Control", "no-cache");
  next();
});

// Removes everything forbidden by XML 1.0 specifications,
// plus the unicode replacement character U+FFFD
function removeXMLInvalidChars(string) {
  var regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;
  return string.replace(regex, "");
}

Questions.get("/feed.rss", async function (req, res, next) {
  const { rows } = await pool.query(
    `SELECT * FROM items 
      WHERE is_topic = true 
      ORDER BY created_at DESC 
      LIMIT ${TOPICS_PER_PAGE}`
  );

  res.locals.url = config.protocol + config.host;
  res.locals.title = "Questions";
  res.locals.topics = rows;

  // We preview one line of the topic body on the question index page
  rows.forEach(function (topic) {
    topic.body = removeXMLInvalidChars(marked(topic.body));
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
Questions.get(["/", "/page/:page"], function (req, res, next) {
  // Pagination data
  if (req.params.page === "1") return res.redirect(req.baseUrl);

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
                ORDER BY has_replies, last_reply_created_at DESC
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
        topic.singular = topic.reply_count === "1";
        if (topic.tags)
          topic.tags = topic.tags.split(",").map((tag) => ({ tag, slug: tag }));
        if (topic.last_reply_created_at)
          topic.answered = moment(topic.last_reply_created_at).fromNow();
        if (topic.created_at) topic.asked = moment(topic.created_at).fromNow();
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

      res.locals.title = page > 1 ? `Page ${page} - Questions` : "Questions";
      res.locals.topics = topics.rows;
      res.locals.paginator = paginator;
      res.locals.search_query = search_query;
      res.render("questions");
    })
    .catch(next);
});

Questions.route(["/tags", "/tags/page/:page"]).get(function (req, res, next) {
  const TAGS_PER_PAGE = 15;
  const page = req.params.page ? parseInt(req.params.page) : 1;

  if (page && !Number.isInteger(page)) {
    return next();
  }

  const offset = (page - 1) * TAGS_PER_PAGE;

  pool
    .query(
      `SELECT taglist.tag,
       (SELECT Count(*)
        FROM   items
        WHERE  items.tags LIKE '%'
                               || taglist.tag
                               || '%') AS total,
    COUNT(*) OVER() AS tags_count                               
FROM   (SELECT DISTINCT Unnest(String_to_array(tags, ',')) AS tag
        FROM   items) taglist
ORDER  BY total DESC
LIMIT ${TAGS_PER_PAGE}
OFFSET ${offset};`
    )
    .then(({ rows }) => {
      if (!rows.length) return res.render("questions/tags");

      // Data for pagination
      let pages_count = Math.ceil(rows[0].tags_count / TAGS_PER_PAGE); // total pages
      let next_page = false;
      if (page < pages_count) next_page = page + 1; // next page value only if current page is not last

      if (pages_count > 1) {
        // create paginator only if there are more than 1 pages
        let paginator = {
          pages: [], // array of pages [{page: 1, current: true}, {...}, ... ]
          next_page: next_page, // next page int
          tags_count: rows[0].tags_count, // total number of topics
        };
        for (let i = 1; i <= pages_count; i++) {
          // filling pages array
          if (i === page) {
            paginator.pages.push({ page: i, current: true });
          } else paginator.pages.push({ page: i, current: false });
        }
        res.locals.paginator = paginator;
      }

      res.locals.title = page > 1 ? `Page ${page} - Tags` : "Tags";
      res.locals.tags = rows;
      res.render("questions/tags");
    })
    .catch(next);
});

// Handle topic viewing and creation
Questions.route("/ask")
  .get(csrf, function (req, res, next) {
    if (!req.user) return res.redirect("/log-in?then=/questions/ask");
    res.locals.csrf = req.csrfToken();
    res.render("questions/ask");
  })
  .post(csrf, function (req, res, next) {
    if (!req.user) return res.redirect("/log-in?then=/questions/ask");
    const author = req.user.uid;
    const title = req.body.title;
    const tags = req.body.tags;
    const body = req.body.body;
    // Disallow empty title or body.
    // TODO: show error message, do not lose form data
    if (title.trim().length === 0 || body.trim().length === 0)
      return next(new Error("Title and body must be set"));
    else {
      pool.query(
        "INSERT INTO items(id, author, title, body, tags, is_topic) VALUES(DEFAULT, $1, $2, $3, $4, true) RETURNING *",
        [author, title, body, tags],
        (error, topic) => {
          if (error) return next(error);
          const newTopic = topic.rows[0];
          res.redirect("/questions/" + newTopic.id);
        }
      );
    }
  });

// Handle new reply to topic
Questions.route("/:id/new").post(csrf, function (req, res, next) {
  const id = parseInt(req.params.id);
  if (!req.user) return res.redirect(`/log-in?then=/questions/${id}/new`);
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
    if (!req.user) return res.redirect(`/log-in?then=/questions/${id}/edit`);
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
        res.locals.csrf = req.csrfToken();
        res.render("questions/edit");
      })
      .catch(next);
  })
  .post(csrf, function (req, res, next) {
    const id = parseInt(req.params.id);
    if (!req.user) return res.redirect(`/log-in?then=/questions/${id}/edit`);
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

          topic.body = highlight(marked(topic.body));

          topic.reply_count = replies.rows.length;
          if (topic.tags)
            topic.tags = topic.tags
              .split(",")
              .map((tag) => ({ tag, slug: tag }));
          topic.asked = moment(topic.created_at).fromNow();
          res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label =
            topic.title;
          replies.rows.forEach((el, index) => {
            replies.rows[index].body = marked(el.body);
            replies.rows[index].answered = moment(
              replies.rows[index].created_at
            ).fromNow();
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
  .get(csrf, async function (req, res, next) {
    const tag = req.params.tag;
    const {
      rows,
    } = await pool.query(
      `SELECT count(*) AS total_affected FROM items WHERE tags ILIKE '%' || $1 || '%'`,
      [tag]
    );
    const total_affected = rows[0].total_affected;

    res.locals.tag = tag;
    res.locals.csrf = req.csrfToken();
    res.locals.total_affected = total_affected;
    res.render("questions/edit-tag.html");
  })
  .post(csrf, async function (req, res, next) {
    const previousTag = req.body.previousTag;
    const tag = req.body.tag;
    const {
      rows,
    } = await pool.query(
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
        res.redirect(req.baseUrl + "/tagged/" + tag);
      }
    );
  });

Questions.get(["/tagged/:tag", "/tagged/:tag/page/:page"], function (
  req,
  res,
  next
) {
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

      // Paginator object for the view
      let paginator = {};

      // We preview one line of the topic body on the question index page
      topics.rows.forEach(function (topic) {
        topic.body = marked(topic.body);
        if (topic.tags)
          topic.tags = topic.tags.split(",").map((tag) => ({ tag, slug: tag }));
        topic.asked = moment(topic.created_at).fromNow();
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
      res.locals.tag = tag;
      res.locals.title = page > 1 ? `Page ${page} - Questions` : "Questions";
      res.locals.topics = topics.rows;
      res.locals.paginator = paginator;
      res.locals.search_query = search_query;
      res.render("questions");
    })
    .catch(next);
});

const he = require("he");
const hljs = require("highlight.js");
const cheerio = require("cheerio");

function highlight(html) {
  const $ = cheerio.load(html);

  $("pre code").each(function () {
    try {
      var lang =$(this).attr("class").split("language-")[1];
      console.log("lang:", lang);
      if (!lang) return;
      var code = $(this).text();
      code = he.decode(code);

      // For some reason highlight
      // doesn't play nicely with already-decoded
      // apostrophes like ' &#84; etc...

      var highlighted = hljs.highlight(lang, code).value;

      $(this).html(highlighted).addClass("hljs").addClass(lang);
    } catch (e) {
      console.log(e);
    }
  });

  return $.html();
}

module.exports = Questions;
