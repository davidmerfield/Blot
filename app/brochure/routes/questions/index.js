var Express = require("express");
var Questions = new Express.Router();
var hbs = require("hbs");
var moment = require("moment");

// Configure connection to Postgres
var Pool = require('pg').Pool;
const pool = new Pool({
    user: 'rakhim',
    host: 'localhost',
    database: 'blot_qa',
    password: 'password',
    port: 5432,
})

// Renders datetime in desired format
// Can be used like so: {{{formatDaytime D}}} where D is timestamp (e.g. from a DB)
hbs.registerHelper("formatDaytime", function(timestamp) {
    try {
        timestamp = moment.utc(timestamp).startOf("minute").fromNow();
    } catch (e) {
        timestamp = "";
    }

    return timestamp;
});

Questions.use(Express.urlencoded({
    extended: true
}))

Questions.use(function(req, res, next) {
    res.locals.base = "/questions";
    next();
});

// Handle topic listing
// Topics are sorted by datetime of last reply, then by topic creation date
Questions.get("/", function(req, res) {
    pool
        .query(`SELECT i.*, last_reply_created_at, COUNT(r.parent_id) AS reply_count
                FROM items i
                LEFT JOIN items r ON r.parent_id = i.id
                    LEFT JOIN (
                        SELECT parent_id, MAX(created_at) last_reply_created_at 
                        FROM items GROUP BY parent_id
                        ) r2 
                    ON r2.parent_id = i.id
                WHERE i.is_topic = true 
                GROUP BY i.id, last_reply_created_at
                ORDER BY last_reply_created_at, i.created_at DESC NULLS LAST`)
        .then(topics => res.render("questions", { title: "Blot — QA", topics: topics.rows }))
        .catch(err => {
            throw err;
        })
});

Questions.get("/new", function (req, res) {
    res.render("questions/new");
});

// Handle new topic
Questions.post('/new', function(req, res) {
    var author = req.user.uid;
    var title = req.body.title;
    var body = req.body.body;
    if (title.trim().length === 0 || body.trim().length === 0) res.redirect("/questions/new");
    else {
        pool.query('INSERT INTO items(id, author, title, body, is_topic) VALUES(DEFAULT, $1, $2, $3, true) RETURNING *', [author, title, body], (error, topic) => {
            if (error) {throw error}
            var newTopic = topic.rows[0];
            res.redirect("/questions/" + newTopic.id);
        })
    }
});

// Handle new reply to topic
Questions.post('/:id/new', function(req, res) {
    const id = parseInt(req.params.id)
    const author = req.user.uid;
    const body = req.body.body;
    if (body.trim().length === 0) res.redirect("/questions/" + id);
    else {
        pool
            .query('INSERT INTO items(id, author, body, parent_id) VALUES(DEFAULT, $1, $2, $3) RETURNING *', [author, body, id])
            .then(item => res.redirect("/questions/" + id))
            .catch(err => {
                throw err;
            })
    }
});


Questions.get("/:id", function(req, res) {
    const id = parseInt(req.params.id)

    pool.query('SELECT * FROM items WHERE id = $1 AND is_topic = true', [id], (error, topics) => {
        if (error) {throw error}
        pool.query('SELECT * FROM items WHERE parent_id = $1 AND is_topic = false', [id], (error, replies) => {
            if (error) {throw error}
            var topic = topics.rows[0];
            res.locals.breadcrumbs = res.locals.breadcrumbs.slice(0, -1);
            res.render("questions/topic", {title: topic.title, topics: replies.rows, topic: topic});
        })
    })
});

module.exports = Questions;
