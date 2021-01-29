module.exports = function () {
	global.test.blog();

	const Queue = require("../index");
	const child_process = require("child_process");
	const hash = require("helper").hash;

	beforeEach(function () {
		this.queueID = hash(Date.now().toString()).slice(0, 10);
		this.queue = new Queue(this.queueID);
		this.workers = [];
		this.sortTasks = (_a, _b) => {
			let a = JSON.stringify(_a);
			let b = JSON.stringify(_b);

			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		};
		this.createWorkers = (options) => {
			let workersToCreate = options.count || 1;

			const launchWorker = () => {
				if (workersToCreate-- === 0) {
					// console.log(`Launched ${options.count} workers`);
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
						// console.log("Worker message:", data);
						return;
					}
					if (options.isRestart && options.onRestart) {
						// console.log("Restarted failed worker");
						options.onRestart();
					}
				});

				worker.on("exit", (code) => {
					if (code === 1 && options.onRestart) {
						// console.log("Worker failed unexpectedly");
						options.count = 1;
						options.isRestart = true;
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
