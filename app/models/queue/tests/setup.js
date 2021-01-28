module.exports = function () {
	global.test.blog();

	const seed = process.argv[3];
	const Queue = require("../index");
	const child_process = require("child_process");
	const hash = require("helper").hash;

	beforeEach(function () {
		this.queueID = hash(Date.now().toString()).slice(0, 10);
		this.queue = new Queue(this.queueID);

		this.workers = [];

		this.createWorkers = (count, module) => {
			for (var i = 1; i <= count; i++) {
				let shouldDie = Math.round(Math.random());
				console.log("launching worker shouldDie=" + shouldDie);
				let worker = child_process.fork(module, [this.queueID, shouldDie], {
					silent: true,
				});
				worker.on("exit", (code) => {
					console.log("worker exitted");
					if (code === 1) {
						this.queue.reprocess((err) => {
							this.createWorkers(1, module);
						});
					}
				});
				this.workers.push(worker);
			}
		};
	});

	afterEach(function (done) {
		this.workers.forEach((worker) => worker.kill());
		this.queue.destroy(done);
	});
};
