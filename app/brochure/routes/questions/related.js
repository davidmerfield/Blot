const config = require("config");
const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.postgres.user,
  host: config.postgres.host,
  database: config.postgres.database,
  password: config.postgres.password,
  port: config.postgres.port,
});

module.exports = async function related(req, res, next) {
  if (["/", "/questions", '/questions/ask'].indexOf(req.path) > -1) return next();

  let search_arr = ["%"]; // array for Postgres; initial value is needed for empty search query case
  // populate with words from query    add '%' prefix and postfix for Postgres pattern matching
  search_arr = req.path
    .split("/")
    .filter((i) => !!i)
    .map((el) => "%" + el + "%");

  const search_arr_str = search_arr.length
    ? JSON.stringify(search_arr).replace(/"/g, "'")
    : null; // stringify and replace double quotes with single quotes for Postgres

  const { rows } = await pool.query(`
        SELECT *, (SELECT Count(*) FROM items x WHERE x.parent_id = y.id) as reply_count
    FROM items y
    WHERE is_topic = true
    ${search_arr_str ? `AND tags ILIKE any (array[${search_arr_str}])` : ""} 
    ORDER BY created_at DESC
    LIMIT 5`);

  res.locals.related = rows;

  return next();
};
