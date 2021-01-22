var client = require("client");
var keys = require("./keys");

module.exports = function (callback) {
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
				total_tasks: 0
			};

			res.slice(2).forEach(function (queue) {
				queue.forEach(function (task) {
					var blogID = task.slice(0, task.indexOf(":"));
					var task = JSON.parse(task.slice(task.indexOf(":") + 1));
					response.queues[blogID] = response.queues[blogID] || [];
					response.queues[blogID].push(task);
					response.total_tasks++;
				});
			});

			callback(err, response);
		});
	});
};
