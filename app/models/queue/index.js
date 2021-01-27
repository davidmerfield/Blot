const debug = require("debug")("blot:models:queue");
const client = require("client");
const async = require("async");
const redis = require("redis");

const MESSAGES = {
	NEW_TASK: "new",
	BAD_TASK: "Tasks must be valid object",
};

module.exports = function Queue(prefix = "") {
	// These keys are used to persist the queue with Redis
	const keys = {
		// A list of blogs with outstanding tasks
		blogs: `queue:${prefix}blogs`,

		// A list of tasks specific to a blog
		blog: (blogID) => `queue:${prefix}blog:${blogID}`,

		// A list of blog:task pairs for all active builds.
		processing: `queue:${prefix}proessing`,

		// A list of blog:task pairs for all completed builds.
		completed: `queue:${prefix}completed`,

		// A channel on which 'new task' and 'queue drained' events are emitted
		channel: `queue:${prefix}channel`,

		// A set of all keys created by this queue for easy cleanup
		all: `queue:${prefix}all`,
	};

	// Method to enqueue a next task
	// You can either pass a single task object or an array of tasks
	this.add = (blogID, tasks, callback = function () {}) => {
		let serializedTasks;

		try {
			if (!Array.isArray(tasks)) {
				tasks = [tasks];
			}
			serializedTasks = tasks.map(
				(task) => blogID + ":" + JSON.stringify(task)
			);
		} catch (e) {
			return callback(new TypeError(MESSAGES.BAD_TASK));
		}

		client
			.multi()
			// Add the blog associated with these new tasks to the list
			// of all blogs with tasks outstanding.
			.lpush(keys.blogs, blogID)
			// Tell all subscribed clients there is a new task
			.publish(keys.channel, MESSAGES.NEW_TASK)
			// Add the tasks to the list of tasks associated with the blog
			.lpush(keys.blog(blogID), serializedTasks)
			// Add the task list for the blog to the list of keys associated
			// with the queue. This allows us to quickly reset the queue.
			.sadd(keys.all, keys.blog(blogID))
			.exec(callback);
	};

	const deserializeTask = (taskString) => [
		taskString.slice(0, taskString.indexOf(":")),
		JSON.parse(taskString.slice(taskString.indexOf(":") + 1)),
	];

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

	this.destroy = (callback = function () {}) => {
		if (this.internalClient) {
			this.internalClient.quit();
			delete this.internalClient;
		}

		client.smembers(keys.all, function (err, queueKeys) {
			if (err) return callback(err);
			client.del(
				[
					keys.blogs,
					keys.processing,
					keys.completed,
					keys.channel,
					keys.all,
					...queueKeys,
				],
				callback
			);
		});
	};

	this.internalClient = redis.createClient();

	this.internalClient.subscribe(keys.channel);

	this.internalClient.on("message", (channel, message) => {
		if (channel !== keys.channel) return;
		if (message !== MESSAGES.NEW_TASK) return;
		if (this.internalQueue) this.internalQueue.push({});
	});

	// We create a seperate client for this process because
	// watch operations only work for the actions of other clients
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

					if (!serializedTasks.length) {
						return reprocessingClient
							.multi()
							.publish(keys.channel, MESSAGES.NEW_TASK)
							.exec(callback);
					}

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

					multi.exec((err) => {
						if (err) return callback(err);
						this.reprocess(callback);
					});
				}
			);
		});
	};

	// We create a seperate client for this process because
	// watch operations only work for the actions of other clients
	let drainClient = redis.createClient();

	this.drainBlog = (blogID, callback = function () {}) => {
		drainClient.watch(keys.blog(blogID), (err) => {
			if (err) {
				return callback(err);
			}

			drainClient
				.multi()
				.del(keys.blog(blogID))
				.lrem(keys.blogs, -1, blogID)
				.srem(keys.all, keys.blog(blogID))
				.exec(function (err, res) {
					if (err) return callback(err);
					console.log("DRAINED BLOG WITH", res);
					callback();
				});
		});
	};

	this.tryToGetTask = (callback) => {
		client.RPOPLPUSH(keys.blogs, keys.blogs, (err, blogID) => {
			if (!blogID) {
				return callback();
			}

			client.RPOPLPUSH(
				keys.blog(blogID),
				keys.processing,
				(err, serializedTask) => {
					if (serializedTask) {
						callback(null, serializedTask);
					} else {
						this.drainBlog(blogID, callback);
					}
				}
			);
		});
	};

	this.process = (processor) => {
		this.internalQueue = async.queue((internalTask, done) => {
			this.tryToGetTask((err, serializedTask) => {
				if (!serializedTask) return done();

				let blogID = deserializeTask(serializedTask)[0];
				let task = deserializeTask(serializedTask)[1];

				processor(blogID, task, (errProcessingTask) => {
					this.internalQueue.push({});

					client
						.multi()
						.lrem(keys.processing, -1, serializedTask)
						.lpush(keys.completed, serializedTask)
						.exec(done);
				});
			});
		});

		debug("adding initial task to internalQueue");
		this.internalQueue.push({});
	};
};
