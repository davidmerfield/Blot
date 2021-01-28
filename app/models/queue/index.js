const debug = require("debug")("blot:models:queue");
const redis = require("redis");
const client = require("client");

// Number of tasks to store on completed task log
const COMPLETED_TASK_LENGTH = 1000;

module.exports = function Queue(prefix = "") {
	// These keys are used with Redis to persist the queue
	const keys = {
		// A list of blogs with outstanding tasks
		blogs: `queue:${prefix}blogs`,

		// A list of tasks specific to a blog
		blog: (blogID) => `queue:${prefix}blog:${blogID}`,

		// A list of blog:task pairs for all active tasks.
		processing: `queue:${prefix}proessing`,

		// A list of blog:task pairs for all completed tasks.
		completed: `queue:${prefix}completed`,

		// A set of all keys created by this queue for easy cleanup
		all: `queue:${prefix}all`,
	};

	// Used to enqueue a next task.
	this.add = (blogID, tasks, callback = function () {}) => {
		let serializedTasks;

		// Tasks can be a single object or a list of objects
		if (!Array.isArray(tasks)) tasks = [tasks];

		try {
			// Takes a blog identifier (String) and a task (Object):
			// 'blog_123' and {path: '/hello.txt'}
			// Returns a string we can use as a Redis key
			// 'blog_123:"{"path":"/hello.txt"}"'
			serializedTasks = tasks.map(
				(task) => blogID + ":" + JSON.stringify(task)
			);
		} catch (e) {
			return callback(new TypeError("Invalid task"));
		}

		client
			.multi()
			// Add the blog which owns the tasks to the list of all blogs
			// with tasks. BlogID may be on the list multiple times.
			.lpush(keys.blogs, blogID)
			// Add the tasks to the list of tasks associated with the blog
			.lpush(keys.blog(blogID), serializedTasks)
			// Store that there exists a list of tasks for this blog.
			// This allows us to quickly reset the queue.
			.sadd(keys.all, keys.blog(blogID))
			.exec(callback);
	};

	// Used to see the state of the queue. Returns information
	// about blogs with queued tasks, a list of active (i.e. processing)
	// tasks and recently completed tasks
	this.inspect = (callback) => {
		client.smembers(keys.all, function (err, queueKeys) {
			if (err) return callback(err);

			let multi = client.multi();

			multi.lrange(keys.blogs, 0, -1);
			multi.lrange(keys.processing, 0, -1);
			multi.lrange(keys.completed, 0, -1);

			queueKeys.forEach(function (queueKey) {
				multi.lrange(queueKey, 0, -1);
			});

			multi.exec(function (err, res) {
				if (err) return callback(err);
				let response = {
					blogs: res[0],
					processing: res[1],
					completed: res[2],
					queues: res.slice(3),
				};

				callback(err, response);
			});
		});
	};

	// Public: used to wipe all information about a queue
	// from the database. Should be called after tests.
	this.destroy = (callback = function () {}) => {
		client.smembers(keys.all, function (err, queueKeys) {
			if (err) return callback(err);
			client.del(
				[keys.blogs, keys.processing, keys.completed, keys.all, ...queueKeys],
				callback
			);
		});
	};

	// Public: used to reattempt the processing function on any task
	// in the processing queue.

	// We create a seperate client for this process because
	// watch operations only work for the actions of other clients

	// Questions to answer:
	// - Do we possibly need a new reprocessing client per function?
	// - Can other reprocessing functions clobber this?
	// - Can we eventually only reprocess tasks for the dead worker?
	// - Can we add a timeout for tasks?
	let reprocessingClient = redis.createClient();

	this.reprocess = (callback = function () {}) => {
		reprocessingClient.watch(keys.processing, (err) => {
			if (err) return callback(err);
			reprocessingClient.lrange(
				keys.processing,
				0,
				-1,
				(err, serializedTasks) => {
					if (err) return callback(err);

					let multi = reprocessingClient.multi();
					let blogs = {};

					serializedTasks.forEach((serializedTask) => {
						let blogID = serializedTask.slice(0, serializedTask.indexOf(":"));

						blogs[blogID] = true;

						multi
							.lpush(keys.blog(blogID), serializedTask)
							.lrem(keys.processing, -1, serializedTask);
					});

					Object.keys(blogs).forEach((blogID) => {
						multi.lpush(keys.blogs, blogID).sadd(keys.all, keys.blog(blogID));
					});

					multi.exec((err, res) => {
						if (err) return callback(err);

						if (res === null) {
							this.reprocess(callback);
						} else {
							// If we call 'reprocess' in a master process
							// it might not have registered its own processor function
							if (this.processor) this.process(this.processor);
							callback();
						}
					});
				}
			);
		});
	};

	// We create a seperate client for this process because
	// watch operations only work for the actions of other clients
	let drainClient = redis.createClient();

	this.drain = (onDrain) => {
		this.onDrain = onDrain;
	};

	this.checkIfBlogIsDrained = (blogID, callback = function () {}) => {
		drainClient.watch(keys.blog(blogID), (err) => {
			if (err) return callback(err);

			drainClient.llen(keys.blog(blogID), (err, length) => {
				if (err) return callback(err);

				// There are still items on the queue
				if (length !== 0) return drainClient.unwatch(callback);

				drainClient
					.multi()
					.del(keys.blog(blogID))
					.srem(keys.all, keys.blog(blogID))
					.lrem(keys.blogs, -1, blogID)
					.exec((err, res) => {
						if (err) return callback(err);

						// If watch causes the multi to fail we get res===null
						if (res && this.onDrain) {
							this.onDrain(blogID);
						}

						callback();
					});
			});
		});
	};

	const processingClient = redis.createClient();

	// Public method which accepts as only argument an asynchronous
	// function that will do work on a given task. It will wait
	// until there is a blog with a task to work on.
	this.process = (processor) => {
		this.processor = processor;
		processingClient.BRPOPLPUSH(keys.blogs, keys.blogs, 0, (err, blogID) => {
			processingClient.RPOPLPUSH(
				keys.blog(blogID),
				keys.processing,
				(err, serializedTask) => {
					if (serializedTask) {
						// Takes a Redis key created during serializedTasks:
						// 'blog_123:"{"path":"/hello.txt"}"'
						// Returns a blog ID (string) and a task (Object):
						// 'blog_123' and {path: '/hello.txt'}
						let task = JSON.parse(
							serializedTask.slice(serializedTask.indexOf(":") + 1)
						);

						processor(blogID, task, (errProcessingTask) => {
							processingClient
								.multi()
								.lrem(keys.processing, -1, serializedTask)
								.lpush(keys.completed, serializedTask)
								.ltrim(keys.completed, 0, COMPLETED_TASK_LENGTH - 1)
								.exec((err) => {
									this.process(processor);
								});
						});
					} else {
						this.checkIfBlogIsDrained(blogID, (err) => {
							this.process(processor);
						});
					}
				}
			);
		});
	};
};
