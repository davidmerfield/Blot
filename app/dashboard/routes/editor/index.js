var Express = require("express");
var editor = Express.Router();


editor.use(require("../settings/load/theme"));

editor.param("template", require("./loadTemplate"));

editor.param("template", function(req, res, next) {
  res.locals.templates = res.locals.templates.filter(function(template) {
    return template.isMine && template.id !== res.locals.template.id;
  });
  next();
});

editor.use(function(req, res, next) {
  res.locals.partials.preview = "template/_preview";
  res.locals.partials.header = "template/_header";
  next();
});

editor.use("/:template/settings", require("./settings"));
editor.use("/:template/editor", require("./editor"));

// require('./view')(server);
// require('./local-editing')(server);

module.exports = editor;
