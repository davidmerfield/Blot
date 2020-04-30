const reds = require("reds");
const transliterate = require("transliteration");
const fs = require("fs-extra");
const async = require("async");
const debug = require("debug")("blot:brochure:build-search-index");

module.exports = function(searchIndexID, viewDirectory, callback) {
	debug(searchIndexID, viewDirectory);

	// Update the blog's search index
	const search = reds.createSearch("site:search:" + searchIndexID);

	// how do we reset the search index?
	// otherwise deleted files will

	// walk directory:
	walk(viewDirectory, callback);

	function walk(directory, done) {
		debug(directory);
		fs.readdir(directory, function onWalk(err, contents) {
			if (err) return done(err);
			async.eachSeries(
				contents,
				function(item, next) {
					let path = directory + "/" + item;
					fs.stat(path, function(err, stat) {
						if (err) return next(err);

						if (stat.isDirectory()) return walk(path, next);
						debug('reading');
						fs.readFile(path, "utf-8", function(err, material) {
							if (err) return next(err);
							material = transliterate(material);

							let id = path.slice(viewDirectory.length);

							if (id.indexOf(".html")) id = id.split(".html").join("");

							debug(id);
							return next();
							search.index(material, id, next);
						});
					});
				},
				done
			);
		});
	}
};
