const QUEUE_ID = process.argv[2];
const Queue = require("../../index");
const queue = new Queue(QUEUE_ID);

queue.process(function (blogID, task, callback) {
	const label = `Worker=${process.pid} Queue=${QUEUE_ID} Task=${JSON.stringify(
		task
	)}`;

	console.log(label, "Started");
	setTimeout(function () {
		console.log(label, "Completed");
		callback();
	}, 100);
});
