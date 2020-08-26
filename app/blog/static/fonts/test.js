const colors = require("colors/safe");
const fs = require("fs-extra");
const express = require("express");
const mustache = require("mustache");

let fonts = require("./index").map((font) => {
	if (font.styles)
		font.styles = mustache.render(font.styles, {
			config: { cdn: { origin: "" } },
		});
	return font;
});

express()
	.get("/:font/controls", function (req, res) {
		res.send(
			mustache.render(
				fs.readFileSync(__dirname + "/test-controls.html", "utf-8"),
				fonts.filter((font) => font.id === req.params.font)[0]
			)
		);
	})
	.get("/", function (req, res) {
		res.send(
			mustache.render(
				fs.readFileSync(__dirname + "/test-index.html", "utf-8"),
				{
					fonts: fonts,
				}
			)
		);
	})
	.get("/:font", function (req, res) {
		res.send(
			mustache.render(
				fs.readFileSync(__dirname + "/test-font.html", "utf-8"),
				fonts.filter((font) => font.id === req.params.font)[0]
			)
		);
	})
	.post(
		"/:font/controls",
		function (req, res, next) {
			var data = "";
			req.on("data", function (chunk) {
				data += chunk;
			});
			req.on("end", function () {
				req.rawBody = data;
				req.body = require("querystring").decode(data);
				next();
			});
		},
		function (req, res) {
			let package = fs.readJSONSync(
				__dirname + "/" + req.params.font + "/package.json"
			);

			for (let field in req.body) package[field] = req.body[field];

			fs.outputJSONSync(
				__dirname + "/" + req.params.font + "/package.json",
				package,
				{
					spaces: 2,
				}
			);

			fonts = fonts.map((font) => {
				if (font.id !== req.params.font) return font;
				for (let field in req.body) font[field] = req.body[field];
				return font;
			});

			res.redirect(req.url);
		}
	)
	.use("/fonts", express.static(__dirname))
	.listen(8898);

console.log("Listening on http://localhost:8898");
