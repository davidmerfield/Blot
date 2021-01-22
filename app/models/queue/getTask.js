var keys = require("./keys");
var client = require("client");

// Implements a fair queue for entry building

module.exports = function (callback) {
	client.RPOPLPUSH(keys.blogs, keys.blogs, function (err, blogID) {
		if (!blogID) return callback(null, null, null, null);

		client.RPOPLPUSH(keys.blog(blogID), keys.processing, function (err, key) {
			if (!key) {
				return client.lrem(keys.blogs, -1, blogID, function (err) {
					callback(err, null, null, null);
				});
			}

			var task = JSON.parse(key.slice(key.indexOf(":") + 1));

			callback(null, blogID, task, function (err, callback) {
				client
					.multi()
					.lrem(keys.processing, -1, key)
					.lpush(keys.completed, key)
					.exec(callback);
			});
		});
	});
};
