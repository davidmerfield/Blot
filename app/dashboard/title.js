const express = require('express');
const parse = require("dashboard/util/parse");

const updateBlog = require('dashboard/util/update-blog');
const title = express.Router();

title.route('/')
    .get((req, res) => {
        res.locals.breadcrumbs.add('Title');
        res.render('settings/title');
    })
    .post(parse, async (req, res) => {
        try {
            const changes = await updateBlog(req.blog.id, {
                title: req.body.title
            });

            if (changes && changes.includes('title')) {
                res.message(req.baseUrl, 'Saved changes to title');
            } else {
                res.redirect(req.baseUrl);
            }

        } catch (error) {
            res.message(req.baseUrl, error);
            return;
        }

    });

module.exports = title;