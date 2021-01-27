const debug = require("debug")("blot:models:queue");
const client = require("client");
const async = require("async");
const redis = require("redis");

module.exports = function Queue(prefix = "") {
	const keys = {
		// A list of blogs with outstanding tasks
		blogs: "queue:" + prefix + "blogs",

		// A list of tasks specific to a blog
		blog: (blogID) => "queue:" + prefix + "blog:" + blogID,

		// A list of blog:task pairs for all active builds.
		processing: "queue:" + prefix + "proessing",

		// A list of blog:task pairs for all completed builds.
		completed: "queue:" + prefix + "completed",

		// A channel on which 'new task' and 'queue drained' events are emitted
		channel: "queue:" + prefix + "channel",

		// A set of all keys created by this queue for easy cleanup
		all: "queue:" + prefix + "all",
	};

	const deserializeTask = (taskString) => [
		taskString.slice(0, taskString.indexOf(":")),
		JSON.parse(taskString.slice(taskString.indexOf(":") + 1)),
	];

	this.add = (blogID, tasks, callback = function () {}) => {
		// You can either pass a single task object or an array of tasks
		if (!Array.isArray(tasks)) {
			tasks = [tasks];
		}

		try {
			// Now we attempt to serialize the tasks to store in Redis
			tasks = tasks.map((task) => blogID + ":" + JSON.stringify(task));
		} catch (e) {
			return callback(new TypeError("Queue: tasks must be valid object"));
		}

		client
			.multi()
			// Add the blog associated with this new task to the list
			// of all blogs with tasks outstanding. Workers watch this.
			.lpush(keys.blogs, blogID)
			// Emit a notification to all subscribed clients that there
			.publish(keys.channel, "new")
			// Add the tasks to the list of tasks associated with the blog
			.lpush(keys.blog(blogID), tasks)
			// Add the task list for the blog to the list of keys associated
			// with the queue. This allows us to quickly reset the queue.
			.sadd(keys.all, keys.blog(blogID))
			.exec(callback);
	};

	this.inspect = (callback) => {
		client.smembers(keys.all, function (err, queueKeys) {
			var multi = client.multi();

			multi.lrange(keys.blogs, 0, -1);
			multi.lrange(keys.processing, 0, -1);
			multi.lrange(keys.completed, 0, -1);

			queueKeys.forEach(function (queueKey) {
				multi.lrange(queueKey, 0, -1);
			});

			multi.exec(function (err, res) {
				var response = {
					blogs: res[0],
					processing: res[1],
					completed: res[2],
					queues: {},
					total_tasks: 0,
				};

				res.slice(2).forEach(function (queue) {
					queue.forEach(function (task) {
						task = deserializeTask(task);
						var blogID = task[0];
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

	this.reset = (callback) => {
		debug("resetting queue");
		client.smembers(keys.all, function (err, queueKeys) {
			var keysToDelete = [
				keys.blogs,
				keys.processing,
				keys.completed,
				keys.channel,
				keys.all,
			];

			if (queueKeys && queueKeys.length) {
				keysToDelete = keysToDelete.concat(queueKeys);
			}

			client.del(keysToDelete, callback);
		});
	};

	this.internalClient = redis.createClient();
	this.internalClient.subscribe(keys.channel);

	this.destroy = (callback) => {
		callback = callback || function () {};
		if (this.internalClient) {
			this.internalClient.unsubscribe(keys.channel);
			this.internalClient.quit();
		}
		this.reset(callback);
	};

	// filter this by message / channel queue prefix
	this.internalClient.on("message", (channel, message) => {
		if (message !== "new") return;
		if (channel !== keys.channel) return;
		if (this.internalQueue) this.internalQueue.push({});
	});

	this.process = (processor) => {
		// create a queue object with concurrency 1
		this.internalQueue = async.queue(function attempt(task, done) {
			var label = require("helper").hash(processor.toString()).slice(0, 6);

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
						debug(
							"processor:",
							label,
							"there are no tasks for the blog " +
								blogID +
								" to process, calling done"
						);
						// we need to check if the blog queue is empty
						// and if so remove it from the list of blogs
						// to process
						return client.lrem(keys.blogs, -1, blogID, function (err) {
							// emit flushed queue
							done();
						});
					}

					debug(
						"processor:",
						label,
						"handing off to task to processing function"
					);

					processor(blogID, deserializeTask(key)[1], function (err) {
						// task completed with error

						if (err) {
							debug("processor:", label, "task completed with error");
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
