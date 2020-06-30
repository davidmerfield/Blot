var blogDir = require("./blogDir");
var ensure = require("./ensure");
var resolve = require("path").resolve;
var join = require("path").join;

// This takes a blog ID and a file
// path and returns the path to the file
// on the server.

module.exports = function(blogID, path) {
	ensure(blogID, "string").and(path, "string");

	if (!path) path = "/";

	const root = join(blogDir, blogID);

	path = path.trim();
	path = path.split("//").join("/");
	// Remove trailing slash
	if (path.slice(-1) === "/") path = path.slice(0, -1);

	// Add leading slash
	if (path[0] !== "/") path = "/" + path;

	// By resolving the user-supplied path against
	// the root of their blog folder we aim to prevent
	// producing a local path which is outside their folder
	path = resolve(root, path);
	path = join(root, path);

	return path;
};
