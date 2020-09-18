const fs = require("fs-extra");
const helper = require("helper");
const localPath = helper.localPath;
const async = require("async");
const Entry = require("entry");
const Path = require('path');

module.exports = function (req, callback) {
	let path = "/";

	if (req.query.path) {
		path = req.query.path;
	}

	fs.readdir(localPath(req.blog.id, path), function (err, contents) {
		// We should pass this error back to the template in future
		if (err) return callback(null, []);

		async.mapLimit(
			contents,
			5,
			function (name, next) {

				let fullPathToItem = Path.join(path, name);

				async.parallel(
					[
						function (done) {
							fs.stat(localPath(req.blog.id, fullPathToItem), function (err, stat) {
								if (err) return done(err);
								done(null, { stat });
							});
						},
						function (done) {
							console.log(req.blog.id, path + "/" + name);

							Entry.get(req.blog.id, path + "/" + name, function (entry) {
								done(null, { entry });
							});
						},
					],
					function (err, results) {
						if (err) return next(err);
						next(null, {
							name: name,
							path: fullPathToItem,
							stat: results[0].stat,
							entry: results[1].entry,
						});
					}
				);
			},
			function (err, contents) {
				console.log(err, contents)
				if (err) return callback(null, []);
				callback(null, contents);
			}
		);
	});
};
