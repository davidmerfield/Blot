var blogDir = require("./blogDir");
var ensure = require("./ensure");
var resolve = require("path").resolve;

// This takes a blog ID and a file
// path and returns the path to the file
// on the server.

module.exports = function(blogID, path) {
	ensure(blogID, "string").and(path, "string");

	const root = resolve(blogDir, blogID);

	if (!path) return "";

	path = path.trim();

	path = path.split("//").join("/");

	// Remove trailing slash
	if (path.slice(-1) === "/") path = path.slice(0, -1);

	// Add leading slash
	if (path[0] !== "/") path = "/" + path;

	path = resolve(blogDir, blogID, path);

	// Ensure the resulting path is inside the blog folder!
	if (path.indexOf(root) !== 0) path = root;

	return path;
};
