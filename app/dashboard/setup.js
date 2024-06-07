const express = require('express');
const parse = require('dashboard/parse');

const setup = express.Router();
const handleFromTitle = require('./account/util/handleFromTitle');

const Blog = require('models/blog');

setup.use((req, res, next) => {
    res.locals.breadcrumbs.at(-1).label = 'Setup site';
    next();
});

// Route for the setup onboarding flow
setup.route('/')
    .get((req, res) => {
        res.locals.step = { title: 'selected' };
        res.render('setup');
    })
    .post(parse, (req, res) => {
        const title = req.body.title;
        const handle = handleFromTitle(title);

        Blog.set(req.blog.id, { title, handle }, (err) => {
            if (err) return res.message(res.locals.base + '/setup', 'Error saving blog');
            res.redirect('/sites/' + handle + '/setup/folder');
        });
    });

setup.route('/folder')
    .all(require('./settings/load/clients'))
    .get((req, res) => {
        res.locals.step = { folder: 'selected' };
        res.render('setup/folder');
    })
    .post(parse, (req, res) => {
        // redirect to template step
        res.redirect(res.locals.base + '/setup/template');
    });

setup.route('/template')
    .get((req, res) => {
        res.locals.step = { template: 'selected' };
        res.render('setup/template');
    })
    .post(parse, (req, res) => {
        res.message(res.locals.base, 'Setup finished');
    });

module.exports = setup;