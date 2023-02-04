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
  if (["/questions", "/questions/ask"].indexOf(req.path) > -1) return next();

  const related_tag = req.path.split("/").pop();

  const { rows } = await pool.query(`
    SELECT *, (SELECT Count(*) FROM items x WHERE x.parent_id = y.id) as reply_count
    FROM items y
    WHERE is_topic = true
    ${related_tag ? `AND (tags ILIKE '${related_tag},%' OR tags ILIKE '%,${related_tag},%' OR tags ILIKE '%,${related_tag}' OR tags ILIKE '${related_tag}') ` : ""} 
    ORDER BY created_at DESC
    LIMIT 5`);

  res.locals.related_tag = related_tag;
  res.locals.related = rows;

  return next();
};
