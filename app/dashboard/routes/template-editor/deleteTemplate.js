var Express = require("express");
var DeleteTemplate = new Express.Router();
var Template = require("template");

DeleteTemplate.route("/").post(function(req, res, next) {
	Template.drop(req.blog.id, req.template.name, function(err) {
		if (err) return next(err);
		res.message("/settings/theme", "Deleted template!");
	});
});

module.exports = DeleteTemplate;
