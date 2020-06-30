var blogDir = require("./blogDir");
var ensure = require("./ensure");
var resolve = require("path").resolve;
var join = require("path").join;

// This takes a blog ID and a file
// path and returns the path to the file
// on the server.

module.exports = function(blogID, path) {
	ensure(blogID, "string").and(path, "string");

	if (!path) return "";

	const root = join(blogDir, blogID);

	path = path.trim();
	path = path.split("//").join("/");

	path = resolve(root, path);
	path = join(root, path);

	// Remove trailing slash
	if (path.slice(-1) === "/") path = path.slice(0, -1);

	// Add leading slash
	if (path[0] !== "/") path = "/" + path;

	return path;
};
