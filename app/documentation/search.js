const Express = require("express");
const Search = new Express.Router();
const { search } = require("models/question");

Search.use((req, res, next) => {
  res.header("Cache-Control", "no-cache");
  next();
});

Search.get("/json", async (req, res) => {
  const query = req.query.query;

  try {
    const questions = await search({ query });
    res.json({
      questions: questions,
      documentation: []
    });
  } catch (e) {
    res.json({
      questions: [],
      documentation: []
    });
  }
});

Search.get("/", async (req, res) => {
  const query = req.query.query;

  try {
    const questions = await search({ query });
    res.locals.questions = questions;
  } catch (e) {
    res.locals.questions = [];
  }

  res.render("search");
});

module.exports = Search;
