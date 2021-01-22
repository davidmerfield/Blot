var client = require("client");
var keys = require("./keys");

module.exports = function (callback) {
	client.smembers(keys.all, function (err, queueKeys) {
		var keysToDelete = [
			keys.blogs,
			keys.processing,
			keys.completed,
			keys.channel,
			keys.all,
		];

		if (queueKeys && queueKeys.length) {
			keysToDelete = keysToDelete.concat(queueKeys);
		}

		client.del(keysToDelete, callback);
	});
};
