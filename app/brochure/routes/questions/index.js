var Express = require("express");
var Questions = new Express.Router();
// var helper = require("helper");
// var QaDB = helper.qaDB;

var Pool = require('pg').Pool;
// Configure connection to Postgres
const pool = new Pool({
    user: 'rakhim',
    host: 'localhost',
    database: 'blot_qa',
    password: 'password',
    port: 5432,
})

Questions.use(Express.urlencoded({
    extended: true
}))

Questions.use(function(req, res, next) {
    res.locals.base = "/questions";
    next();
});

Questions.get("/", function(req, res) {
    pool.query('SELECT * FROM items WHERE is_topic = true ORDER BY id ASC', (error, topics) => {
        if (error) {throw error}
        res.render("questions", { title: "Blot — QA", topics: topics.rows });
    })
});

Questions.get("/new", function (req, res) {
    res.render("questions/new");
});

Questions.post('/new', function(req, res) {
    var author = req.user.uid;
    var title = req.body.title;
    var body = req.body.body;
    pool.query('INSERT INTO items(id, author, title, body, is_topic) VALUES(DEFAULT, $1, $2, $3, true) RETURNING *', [author, title, body], (error, topic) => {
        if (error) {throw error}
        var newTopic = topic.rows[0];
        res.redirect("/questions/" + newTopic.id);
    })
});

Questions.post('/:id/new', function(req, res) {
    const id = parseInt(req.params.id)
    const author = req.user.uid;
    const body = req.body.body;
    pool.query('INSERT INTO items(id, author, body, parent_id) VALUES(DEFAULT, $1, $2, $3) RETURNING *', [author, body, id], (error, item) => {
        if (error) {throw error}
        res.redirect("/questions/" + id);
    })
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
