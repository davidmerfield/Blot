const Express = require("express");
var config = require("config");

// Configure connection to Postgres
const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

// Why text for tags?
// I read this discussion:
// https://stackoverflow.com/questions/1810356/how-to-implement-tag-system
// and concluded it was the simplest method. I doubt we will
// face scaling issues for /questions
pool
  .query(
    `
          ALTER TABLE items
          ADD COLUMN tags text;
  `
  )
  .then((res) => {
    console.log("COLUMN added: tags");
    process.exit();
  })
  .catch((err) => {
    throw err;
    process.exit();
  });
