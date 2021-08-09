const Express = require("express");
var config = require("config");

// Configure connection to Postgres
const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  password: config.postgres.password,
  port: config.postgres.port,
});

if (config.postgres.database != undefined) {
  pool
    .query(`CREATE DATABASE ${config.postgres.database}`)
    .then((res) => {
      console.log("Database created: " + config.postgres.database);
      process.exit();
    })
    .catch((err) => {
      throw err;
      process.exit();
    });
} else {
  console.log("BLOT_POSTGRES_DB is not set. Exiting.");
  process.exit();
}
