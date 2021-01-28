const debug = require("debug")("blot:models:queue");
const client = require("client");
const async = require("async");
const redis = require("redis");

const MESSAGES = {
	NEW_TASK: "New task added to queue",
	BAD_TASK: "Tasks must be valid object",
};

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

		// A channel on which 'new task' and 'queue drained' events are emitted
		channel: `queue:${prefix}channel`,

		// A set of all keys created by this queue for easy cleanup
		all: `queue:${prefix}all`,
	};

	// Used to enqueue a next task. You can either pass a single task
	// object or an array of task objects.
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
			// Add the tasks to the list of tasks associated with the blog
			.lpush(keys.blog(blogID), serializedTasks)
			// Tell all subscribed clients there is a new task. We assume
			// that multiple processes will interact with the same queue
			.publish(keys.channel, MESSAGES.NEW_TASK)
			// Add the task list for the blog to the list of keys associated
			// with the queue. This allows us to quickly reset the queue.
			.sadd(keys.all, keys.blog(blogID))
			.exec(callback);
	};

	const deserializeTask = (taskString) => [
		taskString.slice(0, taskString.indexOf(":")),
		JSON.parse(taskString.slice(taskString.indexOf(":") + 1)),
	];

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

	this.internalClient = redis.createClient();

	this.internalClient.subscribe(keys.channel);

	this.internalClient.on("message", (channel, message) => {
		if (channel !== keys.channel) return;
		if (message !== MESSAGES.NEW_TASK) return;
		if (this.internalQueue) this.internalQueue.push({});
	});

	// Public: used to wipe all information about a queue
	// from the database. Should be called after tests.
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

					if (!serializedTasks.length) {
						return reprocessingClient.unwatch(callback);
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

					multi.exec((err, res) => {
						if (err) return callback(err);

						if (res === null) {
							this.reprocess(callback);
						} else {
							// Add a new task to the internal queue
							if (this.internalQueue) {
								this.internalQueue.push({});
							}
							// Go to the next tick of the internal queue
							if (this.done) {
								this.done();
							}

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
			if (err) {
				return callback(err);
			}
			drainClient
				.multi()
				// For unknown reasons, enabling these causes tasks 
				// to get lost when adding lots of them repeatedly
				// .del(keys.blog(blogID))
				// .srem(keys.all, keys.blog(blogID))
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
	};

	this.process = (processor) => {
		this.internalQueue = async.queue((internalTask, done) => {
			client.RPOPLPUSH(keys.blogs, keys.blogs, (err, blogID) => {
				if (!blogID) return done();

				client.RPOPLPUSH(
					keys.blog(blogID),
					keys.processing,
					(err, serializedTask) => {
						if (serializedTask) {
							let blogID = deserializeTask(serializedTask)[0];
							let task = deserializeTask(serializedTask)[1];

							// Allows us to tick over to the next task manually
							// from the reprocessing function if the processor
							// times out or gets stuck.
							this.done = done;

							processor(blogID, task, (errProcessingTask) => {
								client
									.multi()
									.lrem(keys.processing, -1, serializedTask)
									.lpush(keys.completed, serializedTask)
									.exec((err) => {
										this.internalQueue.push({});
										delete this.done;
										done();
									});
							});
						} else {
							this.checkIfBlogIsDrained(blogID, done);
						}
					}
				);
			});
		});

		// Begin internal queue tick
		this.internalQueue.push({});
	};
};
