module.exports = function (prefix) {
	return {
		all: "queue:" + prefix + "all",

		// circular queue of blog IDs which task
		// fetchers iterate to identify a blog
		// with its own queue to tasks to process
		blogs: "queue:" + prefix + "blogs",

		// list of blog_id:task string pairs for active builds
		// the task string is a JSON object with task info
		processing: "queue:" + prefix + "proessing",

		// list of blog_id:task string pairs for successful builds
		completed: "queue:" + prefix + "completed",

		// channel on which 'new task' and 'queue drained' events are emitted and 
		channel: "queue:" + prefix + "channel",

		// list of tasks for a given blog
		blog: function (blogID) {
			return "queue:" + prefix + "blog:" + blogID;
		},

		// added to blog queue and processing queue
		task: function (blogID, task) {
			return blogID + ":" + JSON.stringify(task);
		},
	};
};
