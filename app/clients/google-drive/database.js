const client = require("client");
const INVALID_ACCOUNT_STRING =
	"Google Drive client: Error decoding JSON for account of blog ";

module.exports = {
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
				return callback(null, null);
			}

			try {
				account = JSON.parse(account);
			} catch (e) {
				return callback(new Error(INVALID_ACCOUNT_STRING + blogID));
			}

			callback(null, account);
		});
	},
	dropAccount: function (blogID, callback) {
		const key = this.accountKey(blogID);
		client.del(key, callback);
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
