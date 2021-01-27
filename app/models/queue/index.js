var debug = require("debug")("blot:models:queue");
var client = require("client");
var async = require("async");
var redis = require("redis");

module.exports = function Queue(prefix) {
	var keys = {
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
		blog: (blogID) => "queue:" + prefix + "blog:" + blogID,

		// added to blog queue and processing queue
		task: (blogID, task) => blogID + ":" + JSON.stringify(task),

		// a set of all keys created by this queue
		// used for easy reset/cleanup
		all: "queue:" + prefix + "all",
	};

	this.add = function add(blogID, tasks, callback) {
		debug("adding tasks to queue");
		callback = callback || function () {};

		// You can either pass a single task object or an array of tasks
		if (!Array.isArray(tasks)) {
			tasks = [tasks];
		}

		try {
			tasks = tasks.map((task) => keys.task(blogID, task));
		} catch (e) {
			return callback(
				new TypeError("Queue: tasks added must be a valid object")
			);
		}

		debug("Adding", tasks.length, "tasks to queue");

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

	function taskHandler(processor) {
		var label = require("helper").hash(processor.toString()).slice(0, 6);

		debug("initing processor:", label);

		return function attempt(task, done) {
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

					processor(
						blogID,
						JSON.parse(key.slice(key.indexOf(":") + 1)),
						function (err) {
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
						}
					);
				});
			});
		};
	}

	this.inspect = function (callback) {
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
						var blogID = task.slice(0, task.indexOf(":"));
						task = JSON.parse(task.slice(task.indexOf(":") + 1));
						response.queues[blogID] = response.queues[blogID] || [];
						response.queues[blogID].push(task);
						response.total_tasks++;
					});
				});

				callback(err, response);
			});
		});
	};

	this.reset = function (callback) {
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

	var otherClient = redis.createClient();

	otherClient.subscribe(keys.channel);

	this.destroy = function (callback) {
		callback = callback || function(){};
		this.reset(function (err) {
			if (err) return callback(err);
			otherClient.quit(callback);
		});
	};

	var internalQueue;

	// filter this by message / channel queue prefix
	otherClient.on("message", function () {
		debug("invoked! adding task to internalQueue");
		if (internalQueue) internalQueue.push({ name: "foo" });
	});

	this.process = function (processor) {
		// create a queue object with concurrency 1

		internalQueue = async.queue(taskHandler(processor));

		debug("adding initial task to internalQueue");
		internalQueue.push({ name: "foo" });
	};
};
