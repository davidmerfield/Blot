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
		].concat(queueKeys);

		console.log("deleting", keysToDelete);

		client.del(keysToDelete, callback);
	});
};
