const config = require("config");
const client = require("models/client");
const questions = require("models/questions");

const keys = require("models/questions/keys");

const Pool = require("pg").Pool;

const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

async function main() {
  const { rows } = await pool.query(`SELECT * from items ORDER BY id ASC`);

  for (const row of rows) {
    console.log(`Migrating ${row.id}...`, row);
    await questions.create({
      id: row.id,
      parent: row.parent_id,
      title: row.title,
      body: row.body,
      author: row.author,
      tags: row.tags ? row.tags.split(",") : [],
      created_at: row.created_at.valueOf(),
    });
  }

  // store the last id
  console.log("setting next id to", rows[rows.length - 1].id, "...");
  client.set(keys.id, rows[rows.length - 1].id);

  process.exit();
}

if (require.main === module) main();
