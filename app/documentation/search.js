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
const fs = require("fs-extra");
const cheerio = require("cheerio");
const root = require("helper/rootDir");
const { join } = require("path");

async function indexDocs() {
  const pages = [];

  const views = `${root}/app/views`;

  const read = async (dir = "/") => {
    const contents = await fs.readdir(join(views, dir));

    for (const i of contents) {
      const stat = await fs.stat(join(views, dir, i));

      if (
        stat.isDirectory() &&
        ![
          "/css",
          "/dashboard",
          "/fonts",
          "/images",
          "/js",
          "/partials",
          "/questions",
          "/videos",
        ].includes(join(dir, i))
      )
        await read(join(dir, i));

      if (
        i.startsWith("error-") ||
        [
          "error.html",
          "sitemap.html",
          "cancel.html",
          "cancelled.html",
          "confirmed.html",
          "sign-up.html",
        ].includes(i)
      )
        continue;

      if (!i.endsWith(".html")) continue;

      const url = join(
        dir,
        i === "index.html" ? "" : i.slice(0, -".html".length)
      );
      const file = await fs.readFile(join(views, dir, i), "utf-8");
      const $ = cheerio.load(file);
      const content = $.text().split("\n").join(" ");
      const title = $("h1").text();
      const tags = "";

      pages.push({
        url,
        content,
        title,
        tags,
      });
    }
  };

  await read();

  console.log(pages);

  await pool.query(`DELETE FROM documentation;`);

  for (const { url, content, title, tags } of pages) {
    await pool.query(
      `INSERT INTO documentation(url, content, title, tags)
          VALUES($1, $2, $3, $4)
          ON CONFLICT (url)
          DO UPDATE SET
            content = EXCLUDED.content,
            title = EXCLUDED.title,
            tags = EXCLUDED.tags`,
      [url, content, title, tags]
    );
  }
}

if (require.main === module) {
  indexDocs();
}

search.get("/", async (req, res) => {
  res.header("Cache-Control", "no-cache");

  const [result, question] = await Promise.all([
    pool.query(
      `
    SELECT title, url, ts_rank_cd(search, query) AS rank
    FROM documentation, websearch_to_tsquery('english', $1) query
    WHERE query @@ search
    ORDER BY rank DESC
    LIMIT 5
    `,
      [req.query.query]
    ),
    pool.query(
      `
    SELECT title, id, parent_id, ts_rank_cd(search, query) AS rank
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
