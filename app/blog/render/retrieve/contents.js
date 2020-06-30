const helper = require("helper");
const localPath = helper.localPath;
const fs = require("fs-extra");

module.exports = function(req, callback) {
	const lengthOfRoot = localPath(req.blog.id, "/").length;
	let path = "/";

	if (req.query.path) {
		path = req.query.path;
	}

	fs.readdir(localPath(req.blog.id, path), function(err, contents) {
		if (err) return callback(err);

		contents = contents.map((name) => {
			return { path: name.slice(lengthOfRoot) };
		});

		callback(null, contents);
	});
};
