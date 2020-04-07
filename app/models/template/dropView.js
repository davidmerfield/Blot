var key = require("./key");
var client = require("client");
var Blog = require("blog");
var getMetadata = require("./getMetadata");

module.exports = function dropView(templateID, viewName, callback) {
	getMetadata(templateID, function(err, metadata) {
		if (err) return callback(err);
		client.del(key.view(templateID, viewName), function(err) {
			if (err) return callback(err);

			client.srem(key.allViews(templateID), viewName, function(err) {
				if (err) return callback(err);

				Blog.set(metadata.owner, { cacheID: Date.now() }, function(err) {
					callback(err, "Deleted " + templateID);
				});
			});
		});
	});
};
