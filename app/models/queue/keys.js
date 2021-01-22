module.exports = {
	all: "queue:all",

	// circular queue of blog IDs
	blogs: "queue:blogs",

	// list of blog_id:task string pairs for active builds
	processing: "queue:proessing",

	// list of blog_id:task string pairs for successful builds
	completed: "queue:completed",

	channel: "queue:channel",

	// list of paths for
	blog: function (blogID) {
		return "queue:blog:" + blogID;
	},

	// added to blog queue and processing queue
	change: function (blogID, task) {
		return blogID + ":" + task;
	},
};
