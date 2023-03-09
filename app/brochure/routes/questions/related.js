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
  const path = require("url").parse(req.originalUrl).pathname;

  if (["/questions", "/questions/ask"].indexOf(path) > -1) return next();

  const related_tag = path.split("/").pop();
  const statement = `SELECT *, (SELECT Count(*) FROM items x WHERE x.parent_id = y.id) as reply_count
    FROM items y
    WHERE is_topic = true
    ${
      related_tag
        ? `AND (
            tags ILIKE ($1 || ',%') OR
            tags ILIKE ('%,' || $1 || ',%') OR
            tags ILIKE ('%,' || $1) OR
            tags ILIKE $1
          )`
        : ""
    } 
    ORDER BY created_at DESC
    LIMIT 5`;

  try {
    const { rows } = await pool.query(
      statement,
      related_tag ? [related_tag] : undefined
    );
    res.locals.related_tag = related_tag;
    res.locals.related = rows;
  } catch (e) {
    console.error("related_tag", related_tag);
    console.error("statement", statement);
    console.error(e);
  }

  return next();
};
