var Express = require("express");
var brochure = new Express.Router();
var finder = require('finder');
var tex = require('./tools/tex');

// Renders the folders and text editors
brochure.use(finder.middleware);

// Renders TeX
brochure.use(tex);

// Renders dates dynamically
brochure.use(require('./tools/dates'));

// Fixes basic typographic errors 
// See typeset.js for more information
brochure.use(require('./tools/typeset'));

// CSS required to render the windows
brochure.get('/css/finder.css', function(req, res){
  res.setHeader("Content-Type", "text/css");
  res.send(finder.css());
});



brochure.get("/about", function(req, res) {
  res.locals.title = "Blot – About";
  res.render("about");
});


brochure.get("/support", function(req, res) {
  res.locals.title = "Blot – Support";
  res.render("support");
});

brochure.get("/contact", function(req, res) {
  res.locals.title = "Contact";
  res.render("contact");
});

brochure.get("/terms", function(req, res) {
  res.locals.title = "Terms of use";
  res.locals.layout = '/partials/layout-focussed.html';
  res.render("terms");
});

brochure.get("/privacy", function(req, res) {
  res.locals.title = "Privacy policy";
  res.locals.layout = '/partials/layout-focussed.html';
  res.render("privacy");
});

brochure.get('/sitemap.xml', require('./sitemap'));


brochure.use("/developers", require("./developers"));

brochure.use("/formatting", require("./formatting"));

// brochure.use("/templates", require("./templates"));

brochure.use("/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

brochure.use(function(req, res, next){
  res.locals.base = '';
  res.locals.selected = {};
  next();
});

brochure.param('section', function(req, res, next){
  res.locals.selected[req.params.section] = 'selected';
  next();
});

brochure.param('subsection', function(req, res, next){
  res.locals.selected[req.params.subsection] = 'selected';
  next();
});

brochure.get("/", function(req, res) {
  res.locals.title = "Blot – brochure";
  res.locals.selected.index = 'selected';
  res.locals.featured = require('./featured');
  res.render("index");
});

brochure.get('/:section', function(req, res){
  res.locals.title = "Blot – " + req.params.section;
  res.render(req.params.section);
});

brochure.get('/:section/:subsection', function(req, res){
  res.locals.title = "Blot – " + req.params.section + ' – ' + req.params.subsection;
  res.render(req.params.section + '/' + req.params.subsection);
});


brochure.use(function(err, req, res, next){
  console.log(err);
  next();
});

module.exports = brochure;
