const Express = require("express");
const Search = new Express.Router();
const { search } = require("models/question");

Search.use((req, res, next) => {
  res.header("Cache-Control", "no-cache");
  next();
});

Search.get("/json", async (req, res) => {
  const query = req.query.query;
  // const [documentation, questions] = await search({ query });
  res.json({
    // questions: questions.rows,
    // documentation: documentation.rows,
  });
});

Search.get("/", async (req, res) => {
  const query = req.query.query;
  // const [documentation, questions] = await search({ query, limit: 20 });
  // res.locals.documentation = documentation.rows.map((row) => {
  //   return {
  //     ...row,
  //     crumbs: row.url.split("/").map((x) => {
  //       return { label: x };
  //     }),
  //   };
  // });
  // res.locals.questions = questions.rows;
  res.render("search");
});

module.exports = Search;
