const Express = require("express");
const urlencoded = Express.urlencoded({
  extended: true,
});

const server = new Express.Router();
const moment = require("moment");
const config = require("config");
const cache = require("helper/express-disk-cache")(config.cache_directory);
const flushOptions = { host: config.host, path: "/https/temporary/questions" };
const flush = () => cache.flush(flushOptions);
const Questions = require("models/questions");
const render = require("./render");
const Paginator = require("./paginator");

server.use(["/ask", "/:id/edit", "/:id/new"], require("dashboard/session"));
server.use(["/ask", "/:id/edit", "/:id/new"], urlencoded);

server.use(async (req, res, next) => {
  res.locals.popular_tags = await Questions.tags();
  next();
});

server.use(function (req, res, next) {
  res.locals.base = "/questions";
  res.locals["show-question-sidebar"] = true;
  res.locals["hide-on-this-page"] = true;
  // The rest of these pages should not be cached
  next();
});

server.get("/feed.rss", async function (req, res) {
  res.locals.url = config.protocol + config.host;
  res.locals.title = "server";
  const { questions } = await Questions.list({ created_at: true });

  res.locals.topics = questions;

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
server.get(["/", "/page/:page"], async function (req, res, next) {
  const page = req.params.page ? parseInt(req.params.page) : 1;

  if (!Number.isInteger(page)) {
    return next();
  }

  const { questions, stats } = await Questions.list({ page });

  res.locals.topics = questions;

  // We preview one line of the topic body on the question index page
  res.locals.topics.forEach(function (topic) {
    topic.body = render(topic.body);
    topic.singular = topic.reply_count === "1";

    topic.tags = topic.tags.map((tag) => {
      return { tag, slug: tag };
    });
  });

  res.locals.title = page > 1 ? `Page ${page} - server` : "server";
  res.locals.paginator = Paginator(
    page,
    stats.page_size,
    stats.total,
    "/questions"
  );

  res.render("questions");
});

server
  .route(["/tags", "/tags/page/:page"])
  .get(async function (req, res, next) {
    const page = req.params.page ? parseInt(req.params.page) : 1;

    if (page && !Number.isInteger(page)) {
      return next();
    }

    const {tags, stats} = await Questions.tags({ page });

    res.locals.title = page > 1 ? `Page ${page} - Tags` : "Tags";
    res.locals.tags = tags;
    res.locals.paginator = Paginator(
      page,
      stats.page_size,
      stats.total,
      "/questions/tags"
    );
    res.render("questions/tags");
  });

// Handle topic viewing and creation
server
  .route("/ask")
  .get(function (req, res) {
    if (!req.session || !req.session.uid)
      return res.redirect("/log-in?then=/questions/ask");
    res.render("questions/ask");
  })
  .post(async (req, res, next) => {
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
      const { id } = await Questions.create({ author, title, body, tags });
      flush();
      res.redirect("/questions/" + id);
    }
  });

// Handle new reply to topic
server.route("/:id/new").post(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!req.session || !req.session.uid)
    return res.redirect(`/log-in?then=/questions/${id}/new`);
  const author = req.session.uid;
  const body = req.body.body;
  if (body.trim().length === 0) res.redirect("/questions/" + id);
  else {
    await Questions.create({ author, body, parent_id: id });
    flush();
    res.redirect("/questions/" + id);
  }
});

server
  .route("/:id/edit")
  .get(async (req, res) => {
    const id = parseInt(req.params.id);
    if (!req.session || !req.session.uid)
      return res.redirect(`/log-in?then=/questions`);

    res.locals.topic = await Questions.get(id);
    res.render("questions/edit");
  })
  .post(async (req, res) => {
    const id = parseInt(req.params.id);

    if (!req.session || !req.session.uid)
      return res.redirect(`/log-in?then=/questions/${id}/edit`);

    const title = req.body.title || "";
    const body = req.body.body;
    const tags = (req.body.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const question = await Questions.update(id, { title, body, tags });
    flush();

    res.redirect(
      "/questions/" + (question.parent_id !== "0" ? question.parent_id : id)
    );
  });

server.route("/:id").get(async (req, res) => {
  const id = parseInt(req.params.id);
  const topic = await Questions.get(id);

  topic.body = render(topic.body);

  topic.reply_count = topic.replies.length;
  topic.asked = moment(topic.created_at).fromNow();
  topic.askedDateStamp = moment(topic.created_at).valueOf();

  res.locals.breadcrumbs[res.locals.breadcrumbs.length - 1].label = topic.title;
  topic.tags = topic.tags.map((tag) => {
    return { tag, slug: tag };
  });

  res.locals.title = topic.title;
  res.locals.topics = topic.replies.map((reply) => {
    reply.body = render(reply.body);
    reply.answered = moment(reply.created_at).fromNow();
    reply.answeredDateStamp = moment(reply.created_at).valueOf();

    return reply;
  });
  res.locals.topic = topic;
  res.render("questions/topic");
});

server.get(
  ["/tagged/:tag", "/tagged/:tag/page/:page"],
  async (req, res, next) => {
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

    const { questions, stats } = await Questions.list({ tag, page });

    const topics = questions;

    // We preview one line of the topic body on the question index page
    topics.forEach(function (topic) {
      topic.body = render(topic.body);
      if (topic.tags)
        topic.tags = topic.tags.map((tag) => ({ tag, slug: tag }));

      topic.asked = moment(topic.created_at).fromNow();
      topic.askedDateStamp = moment(topic.created_at).valueOf();
    });

    res.locals.tag = tag;
    res.locals.title = page > 1 ? `Page ${page} - server` : "server";
    res.locals.topics = topics;
    res.locals.paginator = Paginator(
      page,
      stats.page_size,
      stats.total,
      "/questions/tagged/" + tag
    );
    res.render("questions");
  }
);

module.exports = server;
