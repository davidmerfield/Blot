var keys = require("./keys");
var client = require("client");

module.exports = function add(blogID, tasks, callback) {
	callback = callback || function () {};

	// You can either pass a single task object or an array of tasks
	if (!Array.isArray(tasks)) {
		tasks = [tasks];
	}

	try {
		tasks = tasks.map(JSON.stringify);
		tasks = tasks.map((task) => keys.change(blogID, task));
	} catch (e) {
		return callback(new TypeError("Queue: tasks added must be a valid object"));
	}

	client
		.multi()

		// Add the blog associated with this new task to the list
		// of all blogs with tasks outstanding. Workers watch this.
		.lpush(keys.blogs, blogID)

		// Emit a notification to all subscribed clients that there
		// is a new task available
		.publish(keys.channel, "new")

		// Add the tasks to the list of tasks associated with the blog
		.lpush(keys.blog(blogID), tasks)

		// Add the task list for the blog to the list of keys associated
		// with the queue. This allows us to quickly reset the queue.
		.sadd(keys.all, keys.blog(blogID))

		.exec(callback);
};
