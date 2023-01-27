const config = require("config");
const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

module.exports = async function (req, res, next) {
  const { rows } = await pool.query(`
    SELECT * from items
    WHERE is_topic = true
    LIMIT 5`);

  res.locals.related = rows;

  //AND (tags ILIKE any (array[${search_arr_str}]))
  return next();
};
