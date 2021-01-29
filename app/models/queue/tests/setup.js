module.exports = function () {
	global.test.blog();

	const Queue = require("../index");
	const child_process = require("child_process");
	const hash = require("helper").hash;

	beforeEach(function () {
		this.queueID = hash(Date.now().toString()).slice(0, 10);
		this.queue = new Queue(this.queueID);
		this.workers = [];
		this.createWorkers = (options) => {
			let workersToCreate = options.count || 1;

			const launchWorker = () => {
				if (workersToCreate-- === 0) {
					console.log(`Launched all ${options.count} workers`);
					return;
				}

				let seed = process.argv[3] + ":" + this.workers.length;
				let workerModule = require("path").resolve(__dirname, options.module);
				let worker = child_process.fork(workerModule, [this.queueID, seed], {
					silent: true,
				});

				worker.stdout.on("data", (data) => {
					data = data.toString().trim();
					if (data !== "ready") {
						console.log('Worker message:', data);
						return;
					}
					if (options.isRestart && options.onRestart) {
						console.log("Calling options.onRestart");
						options.onRestart();
					}
				});

				worker.on("exit", (code) => {
					console.log("Worker exited with code=", code);
					if (code === 1 && options.onRestart) {
						options.count = 1;
						options.isRestart = true;
						console.log("Re-calling this.createWorkers");
						this.createWorkers(options);
					}
				});

				this.workers.push(worker);
				launchWorker();
			};

			launchWorker();
		};
	});

	afterEach(function (done) {
		this.workers.forEach((worker) => worker.kill());
		this.queue.destroy(done);
	});
};
