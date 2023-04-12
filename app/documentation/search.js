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

  const query = req.query.query;
  const [result, question] = await Promise.all([
    pool.query(
      `
    SELECT title, url, ts_rank(search, query) AS rank
    FROM documentation, websearch_to_tsquery('english', $1) query
    WHERE query @@ search
    ORDER BY rank DESC
    LIMIT 5
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
      LIMIT 20
    ) t ORDER BY rank DESC
      LIMIT 5

    `,
      [req.query.query]
    ),
  ]);

  const results = result.rows.concat(question.rows);

  results.sort(function (a, b) {
    if (parseFloat(a.rank) > parseFloat(b.rank)) return -1;
    if (parseFloat(b.bank) > parseFloat(a.rank)) return 1;
    return 0;
  });

  res.json({ results, query });
});

module.exports = search;
