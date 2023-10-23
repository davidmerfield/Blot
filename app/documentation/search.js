const Express = require("express");
const Search = new Express.Router();
const { search } = require("models/question");

Search.use((req, res, next) => {
  res.header("Cache-Control", "no-cache");
  next();
});

Search.get("/json", async (req, res) => {
  const query = req.query.query;
  const questions = await search({ query });
  res.json({
    questions: questions,
    documentation: []
  });
});

Search.get("/", async (req, res) => {
  const query = req.query.query;
  const questions = await search({ query });
  res.locals.questions = questions;
  res.render("search");
});

module.exports = Search;
