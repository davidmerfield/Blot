const debug = require("debug")("blot:models:queue");
const client = require("client");

// Number of tasks to store on completed task log
const COMPLETED_TASK_LENGTH = 1000;

module.exports = function Queue(prefix = "") {
	// These keys are used with Redis to persist the queue
	const keys = {
		// A list of blogs with outstanding tasks
		blogs: `queue:${prefix}blogs`,

		// A list of tasks that are awaiting processing
		queued: (blogID) => `queue:${prefix}blog:${blogID}:queued`,

		// A list of tasks that are being processed
		active: (blogID) => `queue:${prefix}blog:${blogID}:active`,

		// A list of tasks that are done
		ended: (blogID) => `queue:${prefix}blog:${blogID}:ended`,

		// Used for cross-process communication about this queue
		channel: `queue:${prefix}channel`,

		// A set of all keys created by this queue for easy cleanup
		all: `queue:${prefix}all`,
	};

	// Used to enqueue a next task.
	this.add = (blogID, tasks, callback = function () {}) => {
		let serializedTasks;

		// Tasks can be a single object or a list of objects
		if (!Array.isArray(tasks)) tasks = [tasks];

		try {
			// Returns a string we can use as a Redis key
			serializedTasks = tasks.map((task) => JSON.stringify(task));
		} catch (e) {
			return callback(new TypeError("Invalid task"));
		}

		client
			.multi()
			// Add the blog which owns the tasks to the list of all blogs
			// with tasks. BlogID may be on the list multiple times.
			.lpush(keys.blogs, blogID)
			// Add the tasks to the list of tasks associated with the blog
			.lpush(keys.queued(blogID), serializedTasks)
			// Store that there exists a list of tasks for this blog.
			// This allows us to quickly reset the queue.
			.sadd(
				keys.all,
				keys.queued(blogID),
				keys.active(blogID),
				keys.ended(blogID)
			)
			.exec(callback);
	};

	// Used to see the state of the queue. Returns information
	// about blogs with queued tasks, a list of active (i.e. processing)
	// tasks and recently completed tasks
	this.inspect = (callback) => {
		client.smembers(keys.all, function (err, queueKeys) {
			if (err) return callback(err);

			// We use batch since we're not writing anything
			let batch = client.batch();

			batch.lrange(keys.blogs, 0, -1);

			queueKeys.forEach(function (queueKey) {
				batch.lrange(queueKey, 0, -1);
			});

			batch.exec(function (err, [blogs, ...queues]) {
				if (err) return callback(err);

				let response = { blogs };

				queues.forEach((queue, i) => {
					let key = queueKeys[i].split(":");
					let category = key.pop();
					let blogID = key.pop();
					response[blogID] = response[blogID] || {};
					response[blogID][category] = queue.map(JSON.parse);
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
			client.del([keys.blogs, keys.channel, keys.all, ...queueKeys], callback);
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
	let reprocessingClient = client.duplicate();

	this.reprocess = (callback = function () {}) => {
		reprocessingClient.lrange(keys.blogs, 0, -1, (err, blogIDs) => {
			if (err) return callback(err);

			if (!blogIDs.length) return callback();

			// Make the list of blogIDs unique this is neccessary
			// because for each task added, the blogID is added to the
			// list of blogs. If we can enforce uniqueness on the list
			// of blogs then we don't need this step.
			blogIDs = Array.from(new Set(blogIDs));

			let activeQueues = blogIDs.map((blogID) => keys.active(blogID));

			reprocessingClient.watch(activeQueues, (err) => {
				if (err) return callback(err);

				let batch = client.batch();

				blogIDs.forEach((blogID) => {
					batch.lrange(keys.active(blogID), 0, -1);
				});

				batch.exec((err, res) => {
					if (err) return callback(err);

					let multi = reprocessingClient.multi();

					res.forEach((serializedTasks, i) => {
						let blogID = blogIDs[i];
						serializedTasks.forEach((serializedTask) => {
							multi
								.lpush(keys.queued(blogID), serializedTask)
								.lrem(keys.active(blogID), -1, serializedTask);
						});
					});

					multi.exec((err, res) => {
						if (err) return callback(err);

						// Something change, re-attempt to reprocess each blog
						if (res === null) {
							this.reprocess(callback);
						} else {
							// If we call 'reprocess' in a master process
							// it might not have registered its own processor function
							if (this.processor) this.process(this.processor);
							callback();
						}
					});
				});
			});
		});
	};

	// We create a seperate client for this process because
	// watch operations only work for the actions of other clients
	let drainClient = client.duplicate();

	this.drain = (onDrain) => {
		let drainSubscriber = client.duplicate();
		drainSubscriber.subscribe(keys.channel);
		drainSubscriber.on("message", function (channel, blogID) {
			if (channel !== keys.channel) return;
			onDrain(blogID);
		});
	};

	// We want to
	this.checkIfBlogIsDrained = (blogID, callback = function () {}) => {
		drainClient.watch(keys.queued(blogID), keys.active(blogID), (err) => {
			if (err) return callback(err);

			drainClient
				.batch()
				.llen(keys.queued(blogID))
				.llen(keys.active(blogID))
				.exec((err, [totalQueuedTasks, totalActiveTasks]) => {
					if (err) return callback(err);

					if (totalQueuedTasks !== 0 || totalActiveTasks !== 0)
						return drainClient.unwatch(callback);

					drainClient
						.multi()
						.lrem(keys.blogs, -1, blogID)
						.publish(keys.channel, blogID)
						.exec(callback);
				});
		});
	};

	const processingClient = client.duplicate();

	// Public method which accepts as only argument an asynchronous
	// function that will do work on a given task. It will wait
	// until there is a blog with a task to work on.
	this.process = (processor) => {
		this.processor = processor;
		processingClient.brpoplpush(keys.blogs, keys.blogs, 0, (err, blogID) => {
			processingClient.rpoplpush(
				keys.queued(blogID),
				keys.active(blogID),
				(err, serializedTask) => {
					if (!serializedTask) return this.process(processor);

					let task = JSON.parse(serializedTask);

					processor(blogID, task, (err) => {
						processingClient
							.multi()
							.lrem(keys.active(blogID), -1, serializedTask)
							.lpush(keys.ended(blogID), serializedTask)
							.ltrim(keys.ended(blogID), 0, COMPLETED_TASK_LENGTH - 1)
							.exec((err) => {
								if (err) debug(err);
								this.checkIfBlogIsDrained(blogID, (err) => {
									this.process(processor);
								});
							});
					});
				}
			);
		});
	};
};
