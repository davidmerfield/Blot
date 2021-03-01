const debug = require("debug")("blot:helper:queue");
const client = require("client");

// Number of tasks to store on completed task log
const COMPLETED_TASK_LENGTH = 1000;

module.exports = function Queue({ prefix = "", parallel = false }) {
	// These keys are used with Redis to persist the queue
	const keys = {
		// A list of sources with outstanding tasks
		queuedSources: `queue:${prefix}sources`,

		// A list of sources with tasks being processes
		activeSources: `queue:${prefix}sourcesProcessing`,

		// A list of tasks that are awaiting processing
		queued: (sourceID) => `queue:${prefix}source:${sourceID}:queued`,

		// A list of tasks that are being processed
		active: (sourceID) => `queue:${prefix}source:${sourceID}:active`,

		// A list of tasks that are done
		ended: (sourceID) => `queue:${prefix}source:${sourceID}:ended`,

		// Used for cross-process communication about this queue
		channel: `queue:${prefix}channel`,

		// A set of all keys created by this queue for easy cleanup
		all: `queue:${prefix}all`,
	};

	// Used to enqueue a next task.
	this.add = (sourceID, tasks, callback = function () {}) => {
		let serializedTasks;

		// Tasks can be a single object or a list of objects
		if (!Array.isArray(tasks)) tasks = [tasks];

		try {
			// Returns a string we can use as a Redis key
			serializedTasks = tasks.map((task) => JSON.stringify(task));
		} catch (e) {
			return callback(new TypeError("Invalid task"));
		}

		client.watch(keys.queuedSources, (err) => {
			if (err) return callback(err);
			client.lrange(keys.queuedSources, 0, -1, (err, sources) => {
				if (err) return callback(err);
				let multi = client.multi();

				multi
					// Add the tasks to the list of tasks associated with the source
					.lpush(keys.queued(sourceID), serializedTasks);

				if (sources.indexOf(sourceID) === -1) {
					// Add the source which owns the tasks to the list of all sources
					// with tasks. sourceID may be on the list multiple times.
					multi
						.lpush(keys.queuedSources, sourceID)
						// Store that there exists a list of tasks for this source.
						// This allows us to quickly reset the queue.
						.sadd(
							keys.all,
							keys.queued(sourceID),
							keys.active(sourceID),
							keys.ended(sourceID)
						);
				}

				multi.exec((err, res) => {
					if (err) return callback(err);

					// Something changed, re-attempt to add these tasks
					if (res === null) {
						this.add(sourceID, tasks, callback);
					} else {
						callback(null);
					}
				});
			});
		});
	};

	// Used to see the state of the queue. Returns information
	// about sources with queued tasks, a list of active (i.e. processing)
	// tasks and recently completed tasks
	this.inspect = (callback) => {
		client.smembers(keys.all, function (err, queueKeys) {
			if (err) return callback(err);

			// We use batch since we're not writing anything
			let batch = client.batch();

			batch.lrange(keys.queuedSources, 0, -1);

			queueKeys.forEach(function (queueKey) {
				batch.lrange(queueKey, 0, -1);
			});

			batch.exec(function (err, [sources, ...queues]) {
				if (err) return callback(err);

				let response = { sources };

				queues.forEach((queue, i) => {
					let key = queueKeys[i].split(":");
					let category = key.pop();
					let sourceID = key.pop();
					response[sourceID] = response[sourceID] || {};
					response[sourceID][category] = queue.map(JSON.parse);
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
				[keys.queuedSources, keys.channel, keys.all, ...queueKeys],
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

	this.reprocess = (callback = function () {}) => {
		client.lrange(
			parallel ? keys.queuedSources : keys.activeSources,
			0,
			-1,
			(err, sourceIDs) => {
				if (err) return callback(err);

				if (!sourceIDs.length) return callback();

				// Make the list of sourceIDs unique this is neccessary
				// because for each task added, the sourceID is added to the
				// list of sources. If we can enforce uniqueness on the list
				// of sources then we don't need this step.
				sourceIDs = Array.from(new Set(sourceIDs));

				let activeQueues = sourceIDs.map((sourceID) => keys.active(sourceID));

				client.watch(activeQueues, (err) => {
					if (err) return callback(err);

					let batch = client.batch();

					sourceIDs.forEach((sourceID) => {
						batch.lrange(keys.active(sourceID), 0, -1);
					});

					batch.exec((err, res) => {
						if (err) return callback(err);

						let multi = client.multi();

						if (!parallel)
							sourceIDs.forEach((sourceID) =>
								multi.lpush(keys.queuedSources, sourceID)
							);

						res.forEach((serializedTasks, i) => {
							let sourceID = sourceIDs[i];
							serializedTasks.forEach((serializedTask) => {
								multi
									.lpush(keys.queued(sourceID), serializedTask)
									.lrem(keys.active(sourceID), -1, serializedTask);
							});
						});

						multi.exec((err, res) => {
							if (err) return callback(err);

							// Something change, re-attempt to reprocess each source
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
			}
		);
	};

	this.drain = (onDrain) => {
		let drainSubscriber = client.duplicate();
		drainSubscriber.subscribe(keys.channel);
		drainSubscriber.on("message", function (channel, sourceID) {
			if (channel !== keys.channel) return;
			onDrain(sourceID);
		});
	};

	// We want to
	this.checkIfSourceIsDrained = (sourceID, callback = function () {}) => {
		client.watch(keys.queued(sourceID), keys.active(sourceID), (err) => {
			if (err) return callback(err);

			client
				.batch()
				.llen(keys.queued(sourceID))
				.llen(keys.active(sourceID))
				.exec((err, [totalQueuedTasks, totalActiveTasks]) => {
					if (err) return callback(err);

					if (totalQueuedTasks !== 0 || totalActiveTasks !== 0)
						return client.unwatch(callback);

					client
						.multi()
						.lrem(keys.queuedSources, -1, sourceID)
						.publish(keys.channel, sourceID)
						.exec(callback);
				});
		});
	};
	
	const processingClient = client.duplicate();

	// Public method which accepts as only argument an asynchronous
	// function that will do work on a given task. It will wait
	// until there is a source with a task to work on.
	this.process = (processor) => {
		this.processor = processor;
		processingClient.brpoplpush(
			keys.queuedSources,
			parallel ? keys.queuedSources : keys.activeSources,
			0,
			(err, sourceID) => {
				processingClient.rpoplpush(
					keys.queued(sourceID),
					keys.active(sourceID),
					(err, serializedTask) => {
						if (!serializedTask) return this.process(processor);

						let task = JSON.parse(serializedTask);

						processor(sourceID, task, (err) => {
							processingClient
								.multi()
								.lrem(keys.active(sourceID), -1, serializedTask)
								.lpush(keys.ended(sourceID), serializedTask)
								.lpush(keys.queuedSources, sourceID)
								.ltrim(keys.ended(sourceID), 0, COMPLETED_TASK_LENGTH - 1)
								.exec((err) => {
									if (err) debug(err);
									this.checkIfSourceIsDrained(sourceID, (err) => {
										this.process(processor);
									});
								});
						});
					}
				);
			}
		);
	};
};
