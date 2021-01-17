var debug = require("debug")("blot:clients:google-drive");
var database = require("./database");
var Blog = require("blog");
var Sync = require("sync");

module.exports = function disconnect(blogID, callback) {
	// We don't want to mess with the blog mid-sync
	Sync(blogID, function (err, folder, done) {
		if (err) return callback(err);

		debug("getting account info");
		database.getAccount(blogID, function (err, account) {
			if (err) return done(err, callback);

			debug("resetting client setting");
			Blog.set(blogID, { client: "" }, function (err) {
				if (err) return done(err, callback);

				debug("dropping blog from database");

				database.dropAccount(blogID, function () {
					if (err) return done(err, callback);

					if (!account) {
						debug("the user chose Dropbox but did not connect their account");
						return done(null, callback);
					}

					done(null, callback);
				});
			});
		});
	});
};
