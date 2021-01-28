var firstClient = require("redis").createClient();
var secondClient = require("redis").createClient();

firstClient.watch("key", function (err, res) {
	console.log("firstClient.watch err:res", err, res);

	secondClient.set("key", Date.now() + "", function (err, res) {
		console.log("secondClient.set err:res", err, res);

		firstClient
			.multi()
			.set("otherkey", "change")
			.exec(function (err, res) {
				console.log("firstClient.multi err:res", err, res);
				process.exit();
			});
	});
});
