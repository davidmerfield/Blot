const { postgres } = require("config");

// Configure connection to Postgres
const Pool = require("pg").Pool;
const pool = new Pool({
  user: postgres.user,
  host: postgres.host,
  database: postgres.database,
  password: postgres.password,
  port: postgres.port,
});

pool
  .query(`truncate items;`)
  .then((res) => {
    console.log(res);
    process.exit();
  })
  .catch((err) => {
    throw err;
    process.exit();
  });
