const Express = require("express");
const TemplateEditor = new Express.Router();
const config = require("config");
const bodyParser = require("body-parser").urlencoded({ extended: false });
const helper = require("helper");
const formJSON = helper.formJSON;
const Template = require("template");

TemplateEditor.param("viewSlug", require("./load/template-views"));
TemplateEditor.param("viewSlug", require("./load/template-view"));
TemplateEditor.param("templateSlug", require("./load/template"));
TemplateEditor.param("templateSlug", function(req, res, next) {
	res.locals.base = `${req.protocol}://${req.hostname}${req.baseUrl}/${req.params.templateSlug}`;
	res.locals.preview = `https://preview-of-my-${req.template.slug}-on-${req.blog.handle}.${config.host}`;
	next();
});

TemplateEditor.use("/:templateSlug", function(req, res, next) {
	if (req.template.localEditing && req.path !== "/local-editing")
		return res.redirect(res.locals.base + "/local-editing");

	res.locals.title = req.template.name;
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
	.all(require("./load/range-inputs"))
	.all(require("../settings/load/dates"))
	.post(
		bodyParser,
		function(req, res, next) {
			let body = formJSON(req.body, Template.metadataModel);
			let newLocals = body.locals;
			let newPartials = body.partials;
			let locals = req.template.locals;
			let partials = req.template.partials;

			for (let key in newLocals) locals[key] = newLocals[key];
			for (let key in newPartials) partials[key] = newPartials[key];

			req.locals = locals;
			req.partials = partials || {};

			console.log(req.locals);
			console.log(req.partials);
			
			next();
		},
		require("./save/fonts"), 
		function(req, res, next) {
			Template.update(
				req.blog.id,
				req.params.templateSlug,
				{ locals: req.locals, partials: req.partials },
				function(err) {
					if (err) return next(err);
					res.message(req.baseUrl + req.url, "Success!");
				}
			);
		}
	)
	.get(function(req, res) {
		res.locals.partials.yield = "template-editor/preview";
		res.locals.partials.sidebar = "template-editor/settings-sidebar";
		res.render("template-editor/layout");
	});

TemplateEditor.route("/:templateSlug/local-editing")
	.get(function(req, res) {
		res.locals.partials.yield = "template-editor/preview";
		res.locals.partials.sidebar = "template-editor/local-editing";
		res.locals.enabled = req.template.localEditing;
		res.locals.title = `Local editing - ${req.template.name}`;
		res.render("template-editor/layout");
	})
	.post(bodyParser, function(req, res, next) {
		const localEditing = !req.template.localEditing;

		Template.setMetadata(req.template.id, { localEditing }, function(err) {
			if (err) return next(err);

			if (localEditing) {
				Template.writeToFolder(req.blog.id, req.template.id, function() {
					// could we do something with this error? Could we wait to render the page?
					// it would be useful to have a progress bar here to prevent
					// busted folder state
					// we should also do something with the error
				});
			}

			res.message(
				res.locals.base + "/local-editing",
				"You can now edit the template locally!"
			);
		});
	});

TemplateEditor.route("/:templateSlug/rename")
	.get(function(req, res) {
		res.locals.partials.yield = "template-editor/preview";
		res.locals.partials.sidebar = "template-editor/rename";
		res.locals.title = `Rename - ${req.template.name}`;
		res.render("template-editor/layout");
	})
	.post(bodyParser, function(req, res, next) {
		Template.setMetadata(req.template.id, { name: req.body.name }, function(
			err
		) {
			if (err) return next(err);
			res.message(res.locals.base + "/settings", "Renamed template!");
		});
	});

TemplateEditor.route("/:templateSlug/delete")
	.get(function(req, res, next) {
		res.locals.partials.yield = "template-editor/preview";
		res.locals.partials.sidebar = "template-editor/delete";
		res.locals.title = `Delete - ${req.template.name}`;
		res.render("template-editor/layout");
	})
	.post(function(req, res, next) {
		Template.drop(req.blog.id, req.template.slug, function(err) {
			if (err) return next(err);
			res.message("/settings/template", "Deleted template!");
		});
	});

TemplateEditor.use(function(err, req, res, next) {
	console.log(err);
	return next(err);
});

TemplateEditor.use("/:templateSlug/source-code", require("./source-code"));

module.exports = TemplateEditor;
