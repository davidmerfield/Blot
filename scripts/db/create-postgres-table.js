const Express = require("express");
var config = require("config");

// Configure connection to Postgres
const Pool = require('pg').Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port
})

pool
  .query(`
          CREATE TABLE items (
              id SERIAL PRIMARY KEY,
              author text,
              body text,
              is_topic boolean DEFAULT false,
              parent_id integer REFERENCES items(id) ON DELETE CASCADE,
              title text,
              created_at timestamp without time zone DEFAULT now(),
              CONSTRAINT items_check CHECK (NOT is_topic OR title IS NOT NULL)
          )
  `)
  .then(res => {
    console.log('Table created: items');
    process.exit();
  })
  .catch(err => {
    throw err;
    process.exit();
  })

