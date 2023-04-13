const Express = require("express");
const search = new Express.Router();
const { postgres } = require("config");
const Pool = require("pg").Pool;
const pool = new Pool({
  user: postgres.user,
  host: postgres.host,
  database: postgres.database,
  password: postgres.password,
  port: postgres.port,
});

search.use((req, res, next) => {
  res.header("Cache-Control", "no-cache");
  next();
});

search.get("/json", async (req, res) => {
  const query = req.query.query;
  const [documentation, questions] = await Query({ query });
  res.json({ questions, documentation });
});

search.get("/", async (req, res) => {
  const query = req.query.query;
  const [documentation, questions] = await Query({ query, limit: 20 });
  res.locals.documentation = documentation;
  res.locals.questions = questions;
  res.render("search");
});

function Query({ query, limit = 5 }) {
  return Promise.all([
    pool.query(
      `
    SELECT title, url, ts_rank(search, query) AS rank
    FROM documentation, websearch_to_tsquery('english', $1) query
    WHERE query @@ search
    ORDER BY rank DESC
    LIMIT ${limit}
    `,
      [query]
    ),
    pool.query(
      `
    SELECT * FROM (
      SELECT DISTINCT ON (url)
        COALESCE(title, (select title from items a where a.id = b.parent_id)) as title,
        '/questions/' || COALESCE(parent_id, id) as url, 
        ts_rank(search, query) AS rank
      FROM items b, websearch_to_tsquery('english', $1) query
      WHERE query @@ search
      ORDER BY url, rank DESC
      LIMIT ${limit * 4}
    ) t ORDER BY rank DESC
      LIMIT ${limit}`,
      [query]
    ),
  ]); // body...
}
module.exports = search;
