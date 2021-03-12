var each = require("./each/entry");
var Entry = require("../app/models/entry");
var Metadata = require("../app/models/metadata");
var dirname = require("path").dirname;

each(
	function (user, blog, entry, next) {
		if (entry.deleted) return next();

		if (entry.pathDisplay) return next();

		Metadata.get(blog.id, entry.path, function (err, name) {
			if (err) throw err;

			if (!name) return next();
			var dir = dirname(entry.path);

			if (dir !== '/') dir += '/';

			var pathDisplay = dir + name;

			if (pathDisplay.toLowerCase() !== entry.path) {
				throw new Error(pathDisplay + " does not match " + entry.path);
			}

			Entry.set(blog.id, entry.path, { pathDisplay }, next);
		});
	},
	function (err) {
		if (err) throw err;
		console.log("Done!");
		process.exit();
	}
);
