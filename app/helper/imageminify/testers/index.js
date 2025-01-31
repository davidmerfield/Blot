const fs = require("fs-extra");
const sources = fs.readdirSync(__dirname + "/source");
const sharp = require("sharp");
const async = require("async");
const minify = require("../index");
const tag = require("child_process")
	.execSync("git rev-parse --short HEAD")
	.toString()
	.trim();

fs.emptyDirSync(__dirname + "/data/resized");
fs.emptyDirSync(__dirname + "/data/minified-" + tag);

let images = [];

async.eachSeries(
	sources,
	(source, next) => {
		console.log("processing", source);
		sharp(__dirname + "/source/" + source)
			.resize({
				width: 1440,
				height: 900,
				fit: sharp.fit.inside,
				withoutEnlargement: true,
			})
			.jpeg({
				quality: 100,
			})
			.toFile(__dirname + "/data/resized/" + source, function (err, info) {
				if (err) throw err;
				console.log("written", source);
				fs.copySync(
					__dirname + "/data/resized/" + source,
					__dirname + "/data/minified-" + tag + "/" + source
				);
				console.log("minifying", source);

				info.before = "/resized/" + source;
				info.after = "minified-" + tag + "/" + source;

				images.push(info);

				minify(__dirname + "/data/minified-" + tag + "/" + source, function (
					err
				) {
					if (err) throw err;
					console.log("minified", source);
					next();
				});
			});
	},
	(err) => {
		if (err) throw err;
		require("express")()
			.get("/", function (req, res) {
				res.send(
					require("mustache").render(
						fs.readFileSync(__dirname + "/demo/index.html", "utf-8"),
						{ images }
					)
				);
			})
			.use(require("express").static(__dirname + "/demo"))
			.use(require("express").static(__dirname + "/data"))
			.listen(8865);
		console.log("Done! View on http://localhost:8865");
	}
);
