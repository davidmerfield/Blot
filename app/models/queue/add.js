var keys = require("./keys");
var client = require("client");

// Implements a fair queue for entry building

module.exports = function add(blogID, tasks, callback) {
	callback = callback || function () {};

	if (!Array.isArray(tasks)) {
		tasks = [tasks];
	}

	tasks = tasks.map(JSON.stringify);

	client
		.multi()
		.lpush(keys.blogs, blogID)
		.publish(keys.channel, "new")
		.lpush(
			keys.blog(blogID),
			tasks.map((task) => keys.change(blogID, task))
		)
		.sadd(keys.all, keys.blog(blogID))
		.exec(callback);
};
