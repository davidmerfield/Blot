const helper = require("helper");
const localPath = helper.localPath;
const fs = require("fs-extra");
const join = require("path").join;

module.exports = function(req, callback) {
	let path = "/";

	if (req.query.path) {
		path = req.query.path;
	}

	fs.readdir(localPath(req.blog.id, path), function(err, contents) {
		if (err) return callback(null, { error: err });

		contents = contents.map((name) => {
			return { path: join(path, name), name: name };
		});

		callback(null, contents);
	});
};
