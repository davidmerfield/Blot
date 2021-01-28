const queueID = process.argv[2];
const shouldDie = parseInt(process.argv[3]);

const Queue = require("../../index");
const queue = new Queue(queueID);

queue.process(function (blogID, task, callback) {
	const label = `Worker=${process.pid} Queue=${queueID} Task=${JSON.stringify(
		task
	)}`;

	console.log(label, "Started shouldDie=" + shouldDie);

	setTimeout(() => {
		if (shouldDie) {
			throw new Error(label + " Unexpected error in test worker process!");
		} else {
			console.log(label, "Completed");
			callback();
		}
	}, 100);
});
