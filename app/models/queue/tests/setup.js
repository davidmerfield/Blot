module.exports = function () {
	global.test.blog();

	const Queue = require("../index");
	const child_process = require("child_process");

	beforeEach(function () {
		this.queue = new Queue(
			require("helper").hash(Date.now().toString()).slice(0, 10)
		);

		this.workers = [];

		this.createWorkers = (count, module) => {
			for (var i = 1; i <= count; i++) {
				let worker = child_process.fork(module, [this.queue.prefix], {
					silent: true,
				});
				worker.on("exit", (code) => {
					if (code === 1) {
						this.queue.reprocess((err) => {
							console.log("reprocessed all tasks");
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
