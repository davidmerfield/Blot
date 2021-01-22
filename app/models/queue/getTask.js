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

			var path = key.slice(key.indexOf(":") + 1);

			callback(null, blogID, path, function (err, callback) {
				var multi = client.multi();
				multi.lrem(keys.processing, -1, key);
				multi.lpush(keys.completed, key);
				multi.exec(callback);
			});
		});
	});
};
