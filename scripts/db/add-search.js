const { postgres } = require("config");

(async function () {
  const Pool = require("pg").Pool;
  const pool = new Pool({
    user: postgres.user,
    host: postgres.host,
    database: postgres.database,
    password: postgres.password,
    port: postgres.port,
  });

  console.log("Adding search index column to questions");
  await pool.query(
    `
    ALTER TABLE items
    ADD COLUMN search tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||' '||
        setweight(to_tsvector('english', coalesce(tags, '')), 'B')  ||' '||
        setweight(to_tsvector('english', coalesce(body, '')), 'C')
      ) STORED;`
  );

  console.log("Creating index for questions");
  await pool.query(`CREATE INDEX items_index ON items USING GIN (search);`);

  console.log("Creating table for documentation");
  await pool.query(`
    CREATE TABLE documentation (
      id SERIAL PRIMARY KEY,
      url text NOT NULL UNIQUE,
      content text NOT NULL,
      title text NOT NULL,
      tags text NOT NULL,
      search tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||' '||
        setweight(to_tsvector('english', coalesce(tags, '')), 'B')  ||' '||
        setweight(to_tsvector('english', coalesce(content, '')), 'C')
      ) STORED              
    );`);

  console.log("Creating index for documentation");
  await pool.query(
    `CREATE INDEX documentation_index ON documentation USING GIN (search);`
  );

  console.log("Done!");
  process.exit();
})();
