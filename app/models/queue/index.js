const debug = require("debug")("blot:models:queue");
const client = require("client");
const async = require("async");
const redis = require("redis");

const NEW_TASK_MESSAGE = "new";

module.exports = function Queue(prefix = "") {
	this.prefix = prefix;

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

	this.add = (blogID, tasks, callback = function () {}) => {
		let serializedTasks;

		// You can either pass a single task object or an array of tasks
		if (!Array.isArray(tasks)) {
			tasks = [tasks];
		}

		try {
			// Now we attempt to serialize the tasks to store in Redis
			serializedTasks = tasks.map(
				(task) => blogID + ":" + JSON.stringify(task)
			);
		} catch (e) {
			return callback(new TypeError("Queue: tasks must be valid object"));
		}

		client
			.multi()
			// Add the blog associated with these new tasks to the list
			// of all blogs with tasks outstanding.
			.lpush(keys.blogs, blogID)
			// Tell all subscribed clients there is a new task
			.publish(keys.channel, NEW_TASK_MESSAGE)
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
		if (message !== NEW_TASK_MESSAGE) return;
		if (this.internalQueue) this.internalQueue.push({});
	});

	this.reprocess = (callback = function () {}) => {
		client.lrange(keys.processing, 0, -1, (err, serializedTasks) => {
			if (err) return callback(err);

			if (!serializedTasks.length) {
				return client.publish(keys.channel, NEW_TASK_MESSAGE, callback);
			}

			let multi = client.multi();
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
		});
	};

	this.process = (processor) => {
		// create a queue object with concurrency 1
		this.internalQueue = async.queue(function attempt(task, done) {
			let label = require("helper").hash(processor.toString()).slice(0, 6);

			debug("processor:", label, "handling task");
			client.RPOPLPUSH(keys.blogs, keys.blogs, function (err, blogID) {
				if (!blogID) {
					debug("processor:", label, "there are no blogs to process");
					return done();
				}

				client.RPOPLPUSH(keys.blog(blogID), keys.processing, function (
					err,
					key
				) {
					if (!key) {
						// todo: use redis watch to ensure we only remove this once
						// all tasks are complete
						// we need to check if the blog queue is empty
						// and if so remove it from the list of blogs
						// to process
						return client.lrem(keys.blogs, -1, blogID, function (err) {
							// emit flushed queue
							done();
						});
					}

					processor(blogID, deserializeTask(key)[1], function (err) {
						// task completed with error

						if (err) {
							// task completed with success
							debug("processor:", label, "re-attempting check for tasks");
							attempt(null, done);
						} else {
							debug("processor:", label, "task completed successfully");
							client
								.multi()
								.lrem(keys.processing, -1, key)
								.lpush(keys.completed, key)
								.exec(function (err) {
									debug("processor:", label, "re-attempting check for tasks");
									attempt(null, done);
								});
						}
					});
				});
			});
		});

		debug("adding initial task to internalQueue");
		this.internalQueue.push({});
	};
};
