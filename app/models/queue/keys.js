module.exports = function (prefix) {
	return {
		all: "queue:" + prefix + "all",

		// circular queue of blog IDs
		blogs: "queue:" + prefix + "blogs",

		// list of blog_id:task string pairs for active builds
		processing: "queue:" + prefix + "proessing",

		// list of blog_id:task string pairs for successful builds
		completed: "queue:" + prefix + "completed",

		channel: "queue:" + prefix + "channel",

		// list of paths for
		blog: function (blogID) {
			return "queue:" + prefix + "blog:" + blogID;
		},

		// added to blog queue and processing queue
		change: function (blogID, task) {
			return blogID + ":" + task;
		},
	};
};
