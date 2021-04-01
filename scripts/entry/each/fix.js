var ensure = require("helper/ensure");

module.exports = function (blog, entry, callback) {
	var changes = [];

	ensure(blog, "object").and(entry, "object").and(callback, "function");

	return callback(entry, changes);
};
