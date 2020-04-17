const extractMetadata = require("../../metadata");
const localPath = require("helper").localPath;
const fs = require("fs-extra");

module.exports = function(blog, text) {
	if (!text) return;

	const pathToCSL = extractMetadata(text).metadata.csl;

	if (!pathToCSL) return;

	const fullPath = localPath(blog.id, pathToCSL);

	if (!fs.existsSync(fullPath)) return;

	return fullPath;
};
