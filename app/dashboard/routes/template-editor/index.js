var Express = require("express");
var TemplateEditor = new Express.Router();
var config = require("config");
var bodyParser = require("body-parser").urlencoded({ extended: false });
var helper = require("helper");
var Template = require("template");

TemplateEditor.use(function(req, res, next) {
	res.locals.partials["input-color"] = "template-editor/input-color";
	res.locals.partials["input-font"] = "template-editor/input-font";
	res.locals.partials["chrome"] = "template-editor/chrome";
	next();
});

TemplateEditor.post(bodyParser);

TemplateEditor.param("viewSlug", require("./load/template-view"));

TemplateEditor.param("templateSlug", require("./load/template"));

TemplateEditor.param("templateSlug", function(req, res, next) {
	res.locals.base = `${req.protocol}://${req.hostname}${req.baseUrl}/${req.params.templateSlug}`;
	res.locals.preview = `https://preview-of-my-${req.template.slug}-on-${req.blog.handle}.${config.host}`;
	next();
});

TemplateEditor.use("/:templateSlug/:section", function(req, res, next) {
	res.locals.selected = {};
	res.locals.selected[req.params.section] = "selected";
	next();
});



TemplateEditor.route("/:templateSlug/settings")
	.all(require("./load/font-inputs"))
	.all(require("./load/color-inputs"))
	.post(bodyParser, function(req, res, next) {
		let updatedLocals = helper.formJSON(req.body, Template.metadataModel)
			.locals;

		let locals = req.template.locals;

		for (let key in updatedLocals) locals[key] = updatedLocals[key];

		Template.update(req.blog.id, req.params.templateSlug, { locals }, function(
			err
		) {
			if (err) return next(err);
			res.message(req.baseUrl + "/" + req.url, "Success!");
		});
	})
	.get(function(req, res) {
		res.render("template-editor/settings");
	});

TemplateEditor.route("/:templateSlug/source-code")
	.all(require("./load/template-views"))
	.get(function(req, res) {
		res.render("template-editor/source-code");
	});

TemplateEditor.route("/:templateSlug/source-code/:viewSlug/edit/")
	.all(require("./load/template-views"))
	.get(function(req, res) {
		res.render("template-editor/source-code");
	});

TemplateEditor.use("/:templateSlug/delete", require("./deleteTemplate"));

module.exports = TemplateEditor;
