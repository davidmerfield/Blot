const debug = require("debug")("blot:models:queue");
const client = require("client");
const redis = require("redis");

const MESSAGES = {
	NEW_TASK: "New task added to queue",
	BAD_TASK: "Tasks must be valid object",
};

const serializeTask = (blogID) => (task) => blogID + ":" + JSON.stringify(task);

const deserializeTask = (taskString) => [
	taskString.slice(0, taskString.indexOf(":")),
	JSON.parse(taskString.slice(taskString.indexOf(":") + 1)),
];

module.exports = function Queue(prefix = "") {
	// These keys are used with Redis to persist the queue
	const keys = {
		// A list of blogs with outstanding tasks
		blogs: `queue:${prefix}blogs`,

		// A list of tasks specific to a blog
		blog: (blogID) => `queue:${prefix}blog:${blogID}`,

		// A list of blog:task pairs for all active builds.
		processing: `queue:${prefix}proessing`,

		// A list of blog:task pairs for all completed builds.
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
			serializedTasks = tasks.map(serializeTask(blogID));
		} catch (e) {
			return callback(new TypeError(MESSAGES.BAD_TASK));
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
					queues: {},
					total_tasks: 0,
				};

				res.slice(3).forEach(function (queue) {
					queue.forEach(function (task) {
						task = deserializeTask(task);
						let blogID = task[0];
						task = task[1];
						response.queues[blogID] = response.queues[blogID] || [];
						response.queues[blogID].push(task);
						response.total_tasks++;
					});
				});

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
				[
					keys.blogs,
					keys.processing,
					keys.completed,
					keys.all,
					...queueKeys,
				],
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
						let blogID = deserializeTask(serializedTask)[0];

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
							this.process(this.processor);
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
						let blogID = deserializeTask(serializedTask)[0];
						let task = deserializeTask(serializedTask)[1];
						processor(blogID, task, (errProcessingTask) => {
							processingClient
								.multi()
								.lrem(keys.processing, -1, serializedTask)
								.lpush(keys.completed, serializedTask)
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
