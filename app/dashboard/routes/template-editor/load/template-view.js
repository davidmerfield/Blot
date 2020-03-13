var Template = require("template");
var extname = require("path").extname;

module.exports = function(req, res, next) {
	Template.getView(req.template.id, req.params.viewSlug, function(err, view) {
		if (err || !view) return next(new Error("No view"));

		view.editorMode = editorMode(view);
		res.locals.view = view;

		next();
	});
};

// Determine the mode for the
// text editor based on the file extension
function editorMode(view) {
	var mode = "xml";

	if (extname(view.name) === ".js") mode = "javascript";

	if (extname(view.name) === ".css") mode = "css";

	if (extname(view.name) === ".txt") mode = "text";

	return mode;
}
