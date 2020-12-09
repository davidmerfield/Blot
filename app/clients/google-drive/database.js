
const client = require("client");

const database = {
	accountKey: function (blogID) {
		return "blog:" + blogID + ":googledrive:account";
	},
	getAccount: function (blogID, callback) {
		const key = this.accountKey(blogID);

		client.get(key, function (err, account) {
			if (err) {
				return callback(err);
			}

			if (!account) {
				return callback(new Error(NO_ACCOUNT_ERROR + blogID));
			}

			try {
				account = JSON.parse(account);
			} catch (e) {
				return callback(new Error(INVALID_ACCOUNT_STRING + blogID));
			}

			callback(null, account);
		});
	},
	setAccount: function (blogID, changes, callback) {
		const key = this.accountKey(blogID);

		this.getAccount(blogID, function (err, account) {
			// we don't care if the account doesn't exist
			// if (err) return callback(err);

			account = account || {};

			for (var i in changes) {
				account[i] = changes[i];
			}

			client.set(key, JSON.stringify(account), callback);
		});
	},
};

database.setAccount("123", { foo: "bar" }, function (err) {
	if (err) throw err;
	database.getAccount("123", function (err, account) {
		if (err) throw err;
		console.log("got account", account);
	});
});