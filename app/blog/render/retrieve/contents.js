const fs = require("fs-extra");
const helper = require("helper");
const localPath = helper.localPath;

module.exports = function(req, callback) {
	let path = "/";

	if (req.query.path) {
		path = req.query.path;
	}

	fs.readdir(localPath(req.blog.id, path), function(err, contents) {
		// We should pass this error back to the template in future
		if (err) return callback(null, []);

		contents = contents.map((name) => {
			return { name: name };
		});

		callback(null, contents);
	});
};
