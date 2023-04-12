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

search.get("/", async (req, res) => {
  res.header("Cache-Control", "no-cache");

  const [result, question] = await Promise.all([
    pool.query(
      `
    SELECT title, url, ts_rank(search, query) AS rank
    FROM documentation, websearch_to_tsquery('english', $1) query
    WHERE query @@ search
    ORDER BY rank DESC
    LIMIT 5
    `,
      [req.query.query]
    ),
    pool.query(
      `
    SELECT title, id, parent_id, ts_rank(search, query) AS rank
    FROM items, websearch_to_tsquery('english', $1) query
    WHERE query @@ search
    ORDER BY rank DESC
    LIMIT 5
    `,
      [req.query.query]
    ),
  ]);

  res.json(
    result.rows
      .concat(
        question.rows.map(({ title, id, parent_id }) => {
          return { title, url: "/questions/" + (parent_id || id) };
        })
      )
      .sort(function (a, b) {
        if (a.rank > b.rank) return -1;
        if (b.bank > a.rank) return 1;
        return 0;
      })
  );
});

module.exports = search;
