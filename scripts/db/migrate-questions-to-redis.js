const config = require("config");

const questions = require("models/questions");

const Pool = require("pg").Pool;

const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

async function main() {
  const { rows } = await pool.query(`SELECT * from items`);

  for (const row of rows) {
    console.log(`Migrating ${row.id}...`, row);
    await questions.update(row.id, {
      parent_id: row.parent_id,
      title: row.title,
      body: row.body,
      author: row.author,
      tags: row.tags.split(","),
      created_at: row.created_at.valueOf(),
    });
  }

  process.exit();
}

if (require.main === module) main();
