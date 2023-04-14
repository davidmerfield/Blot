const config = require("config");
const moment = require("moment");
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

  if (["/questions", "/questions/ask", "/contact"].indexOf(path) > -1) return next();

  const related_tag = path.split("/").pop();
  const statement = `
    SELECT *, 
      (SELECT Count(*) FROM items x WHERE x.parent_id = y.id) as reply_count,
      (Select MAX(created_at) FROM items z WHERE z.parent_id = y.id) as last_reply_created_at 
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
    ORDER BY last_reply_created_at DESC
    LIMIT 5`;

  try {
    const { rows } = await pool.query(
      statement,
      related_tag ? [related_tag] : undefined
    );
    res.locals.related_tag = related_tag;
    res.locals.related = rows.map((row) => {
      return { ...row, time: moment(row.last_reply_created_at).fromNow() };
    });
  } catch (e) {
    console.error("related_tag", related_tag);
    console.error("statement", statement);
    console.error(e);
  }

  return next();
};
